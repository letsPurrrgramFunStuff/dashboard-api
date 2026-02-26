import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { conditionSnapshots } from "../schema";

const CONDITION_PROVIDERS = ["nearmap", "eagleview"] as const;
const CONDITIONS = ["good", "fair", "poor", "critical"] as const;

export async function seedConditionSnapshot(
  db: NodePgDatabase<any>,
  propertyIds: number[],
) {
  const snapshotData = Array.from({ length: 120 }).map(() => ({
    propertyId: faker.helpers.arrayElement(propertyIds),
    provider: faker.helpers.arrayElement(CONDITION_PROVIDERS),
    snapshotDate: faker.date.past().toISOString().split("T")[0],
    imageryUrl: `https://imagery.example.com/${faker.string.uuid()}.jpg`,
    thumbnailUrl: `https://imagery.example.com/thumb_${faker.string.uuid()}.jpg`,
    conditionOverall: faker.helpers.arrayElement(CONDITIONS),
    roofCondition: faker.helpers.arrayElement(CONDITIONS),
    exteriorCondition: faker.helpers.arrayElement(CONDITIONS),
    aiAttributes: {},
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  }));
  await db.insert(conditionSnapshots).values(snapshotData);
}
