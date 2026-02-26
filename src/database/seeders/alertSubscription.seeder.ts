import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { alertSubscriptions } from "../schema";

export async function seedAlertSubscription(
  db: NodePgDatabase<any>,
  userIds: number[],
  propertyIds: number[],
) {
  const ALERT_TYPES = [
    "new_violation",
    "violation_resolved",
    "new_permit",
    "complaint_spike",
    "condition_change",
  ] as const;
  const CHANNELS = ["in_app", "email"] as const;
  const subData = Array.from({ length: 100 }).map(() => ({
    userId: faker.helpers.arrayElement(userIds),
    propertyId: faker.datatype.boolean()
      ? faker.helpers.arrayElement(propertyIds)
      : null,
    alertType: faker.helpers.arrayElement(ALERT_TYPES),
    channel: faker.helpers.arrayElement(CHANNELS),
    isActive: faker.datatype.boolean(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  }));
  await db.insert(alertSubscriptions).values(subData);
}
