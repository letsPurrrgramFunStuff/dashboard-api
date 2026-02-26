import type { FastifyRequest, FastifyReply } from "fastify";
import type { Static } from "@sinclair/typebox";
import { eq, and, isNull, count, desc } from "drizzle-orm";
import { PropertiesRepository } from "./properties.repository";
import {
  CreatePropertySchema,
  PropertyParamsSchema,
  PropertyQuerySchema,
  UpdatePropertySchema,
} from "./properties.schema";
import * as schema from "../../database/schema";

type CreateBody = Static<typeof CreatePropertySchema>;
type UpdateBody = Static<typeof UpdatePropertySchema>;
type Params = Static<typeof PropertyParamsSchema>;
type Query = Static<typeof PropertyQuerySchema>;

export const listPropertiesController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { organizationId } = request.user as { organizationId: number };
  const repo = new PropertiesRepository(request.server.db);
  const query = request.query as Query;
  const { rows, total, riskCounts } = await repo.findAll(organizationId, query);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  return reply.send({ data: rows, total, page, pageSize, riskCounts });
};

export const getPropertyController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { organizationId } = request.user as { organizationId: number };
  const repo = new PropertiesRepository(request.server.db);
  const params = request.params as Params;
  const prop = await repo.findById(parseInt(params.id), organizationId);
  if (!prop) return reply.status(404).send({ message: "Property not found" });

  const db = request.server.db;
  const pid = parseInt(params.id);

  const [
    openSignalsResult,
    activeTasksResult,
    unreadAlertsResult,
    latestCondition,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(schema.signals)
      .where(
        and(
          eq(schema.signals.propertyId, pid),
          eq(schema.signals.isActive, true),
        ),
      ),
    db
      .select({ total: count() })
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.propertyId, pid),
          isNull(schema.tasks.deletedAt),
          eq(schema.tasks.status, "open"),
        ),
      ),
    db
      .select({ total: count() })
      .from(schema.alerts)
      .where(
        and(
          eq(schema.alerts.propertyId, pid),
          eq(schema.alerts.isRead, false),
          isNull(schema.alerts.dismissedAt),
        ),
      ),
    db
      .select({
        conditionOverall: schema.conditionSnapshots.conditionOverall,
      })
      .from(schema.conditionSnapshots)
      .where(eq(schema.conditionSnapshots.propertyId, pid))
      .orderBy(desc(schema.conditionSnapshots.snapshotDate))
      .limit(1),
  ]);

  const ENUM_TO_SCORE: Record<string, number> = {
    good: 90,
    fair: 70,
    poor: 40,
    critical: 10,
  };
  const conditionScore =
    ENUM_TO_SCORE[latestCondition[0]?.conditionOverall ?? ""] ?? null;

  return reply.send({
    data: {
      ...prop,
      stats: {
        openSignals: Number(openSignalsResult[0]?.total ?? 0),
        activeTasks: Number(activeTasksResult[0]?.total ?? 0),
        unreadAlerts: Number(unreadAlertsResult[0]?.total ?? 0),
        conditionScore,
      },
    },
  });
};

export const createPropertyController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { organizationId } = request.user as { organizationId: number };
  const repo = new PropertiesRepository(request.server.db);
  const prop = await repo.create(organizationId, request.body as CreateBody);
  return reply.status(201).send({ data: prop });
};

export const updatePropertyController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { organizationId } = request.user as { organizationId: number };
  const repo = new PropertiesRepository(request.server.db);
  const params = request.params as Params;
  const existing = await repo.findById(parseInt(params.id), organizationId);
  if (!existing)
    return reply.status(404).send({ message: "Property not found" });
  const updated = await repo.update(
    parseInt(params.id),
    request.body as UpdateBody,
  );
  return reply.send({ data: updated });
};

export const deletePropertyController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { organizationId } = request.user as { organizationId: number };
  const repo = new PropertiesRepository(request.server.db);
  const params = request.params as Params;
  const existing = await repo.findById(parseInt(params.id), organizationId);
  if (!existing)
    return reply.status(404).send({ message: "Property not found" });
  await repo.softDelete(parseInt(params.id));
  return reply.status(204).send();
};
