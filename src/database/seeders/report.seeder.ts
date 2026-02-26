import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { reports } from "../schema";

export async function seedReport(
  db: NodePgDatabase<any>,
  propertyIds: number[],
  userIds: number[],
) {
  const reportData = Array.from({ length: 100 }).map(() => {
    const periodStart = faker.date.past();
    const periodEnd = faker.date.soon({ days: 30, refDate: periodStart });
    return {
      propertyId: faker.helpers.arrayElement(propertyIds),
      generatedBy: faker.helpers.arrayElement(userIds),
      reportType: faker.helpers.arrayElement([
        "owner_pack",
        "insurance_packet",
      ] as const),
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      storageUrl: faker.internet.url(),
      fileName: faker.system.fileName(),
      createdAt: faker.date.recent(),
    };
  });
  await db.insert(reports).values(reportData);
}
