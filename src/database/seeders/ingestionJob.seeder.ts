import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { ingestionJobs } from "../schema";

export async function seedIngestionJob(
  db: NodePgDatabase<any>,
  propertyIds: number[],
) {
  const STATUSES = ["pending", "running", "success", "failed"] as const;
  const JOB_TYPES = [
    "property_sync",
    "signal_import",
    "condition_snapshot",
    "risk_score_update",
    "report_generation",
  ] as const;
  const jobData = Array.from({ length: 120 }).map(() => ({
    jobType: faker.helpers.arrayElement(JOB_TYPES),
    propertyId: faker.datatype.boolean()
      ? faker.helpers.arrayElement(propertyIds)
      : null,
    status: faker.helpers.arrayElement(STATUSES),
    startedAt: faker.date.past(),
    completedAt: faker.date.recent(),
    errorMessage: null,
    resultSummary: {},
    createdAt: faker.date.recent(),
  }));
  await db.insert(ingestionJobs).values(jobData);
}
