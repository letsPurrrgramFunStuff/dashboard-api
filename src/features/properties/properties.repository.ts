import {
  and,
  eq,
  ilike,
  isNull,
  or,
  gte,
  lt,
  between,
  desc,
  count,
  sql,
} from "drizzle-orm";
import { properties } from "@database/schema";
import type { Database } from "@database/database";
import type { Static } from "@sinclair/typebox";
import type {
  CreatePropertySchema,
  PropertyQuerySchema,
} from "./properties.schema";

type CreatePropertyInput = Static<typeof CreatePropertySchema>;
type PropertyQuery = Static<typeof PropertyQuerySchema>;

export class PropertiesRepository {
  constructor(private db: Database) {}

  async findAll(organizationId: number, query: PropertyQuery) {
    const {
      page = 1,
      pageSize = 25,
      search,
      city,
      state,
      minRiskScore,
      riskLevel,
    } = query;
    const offset = (page - 1) * pageSize;

    const conditions = [
      eq(properties.organizationId, organizationId),
      isNull(properties.deletedAt),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(properties.addressLine1, `%${search}%`),
          ilike(properties.name ?? "", `%${search}%`),
        ) as ReturnType<typeof eq>,
      );
    }
    if (city) conditions.push(ilike(properties.city, `%${city}%`));
    if (state) conditions.push(eq(properties.state, state));
    if (minRiskScore !== undefined)
      conditions.push(gte(properties.riskScore, minRiskScore));
    if (riskLevel === "high") conditions.push(gte(properties.riskScore, 60));
    if (riskLevel === "medium")
      conditions.push(between(properties.riskScore, 40, 59));
    if (riskLevel === "low") conditions.push(lt(properties.riskScore, 40));

    const where = and(...conditions);

    const [rows, [{ total }], [stats]] = await Promise.all([
      this.db
        .select()
        .from(properties)
        .where(where)
        .orderBy(desc(properties.riskScore))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ total: count() }).from(properties).where(where),
      this.db
        .select({
          highCount: sql<number>`count(*) filter (where ${properties.riskScore} >= 60)`,
          mediumCount: sql<number>`count(*) filter (where ${properties.riskScore} >= 40 and ${properties.riskScore} < 60)`,
          lowCount: sql<number>`count(*) filter (where ${properties.riskScore} < 40)`,
        })
        .from(properties)
        .where(where),
    ]);

    return {
      rows,
      total,
      riskCounts: {
        high: Number(stats.highCount),
        medium: Number(stats.mediumCount),
        low: Number(stats.lowCount),
      },
    };
  }

  async findById(id: number, organizationId: number) {
    const result = await this.db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, id),
          eq(properties.organizationId, organizationId),
          isNull(properties.deletedAt),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async create(organizationId: number, data: CreatePropertyInput) {
    const result = await this.db
      .insert(properties)
      .values({ ...data, organizationId })
      .returning();
    return result[0];
  }

  async update(id: number, data: Partial<CreatePropertyInput>) {
    const result = await this.db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: number) {
    await this.db
      .update(properties)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(properties.id, id));
  }
}
