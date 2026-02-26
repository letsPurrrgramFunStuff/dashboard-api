import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import { eq } from "drizzle-orm";

const DEFAULT_ORG = {
  name: "Dashboard",
  planTier: "enterprise",
};

export const seedOrganization = async (db: NodePgDatabase<typeof schema>) => {
  const existingOrg = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.name, DEFAULT_ORG.name))
    .limit(1);

  if (existingOrg.length === 0) {
    const [org] = await db
      .insert(schema.organizations)
      .values(DEFAULT_ORG)
      .returning({ id: schema.organizations.id });
    console.log(`🌱 Seeded organization: ${DEFAULT_ORG.name}`);
    return org.id;
  } else {
    return existingOrg[0].id;
  }
};
