import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { seedOrganization } from "./seeders/organization.seeder";
import { seedUser } from "./seeders/user.seeder";
import { seedProperty } from "./seeders/property.seeder";
import { seedSignal } from "./seeders/signal.seeder";
import { seedTask } from "./seeders/task.seeder";
import { seedAlert } from "./seeders/alert.seeder";
import { seedReport } from "./seeders/report.seeder";
import { seedTaskComment } from "./seeders/taskComment.seeder";
import { seedTaskAttachment } from "./seeders/taskAttachment.seeder";
import { seedConditionSnapshot } from "./seeders/conditionSnapshot.seeder";
import { seedPropertyIdentifier } from "./seeders/propertyIdentifier.seeder";
import { seedAlertSubscription } from "./seeders/alertSubscription.seeder";
import { seedIngestionJob } from "./seeders/ingestionJob.seeder";
import { seedApiCache } from "./seeders/apiCache.seeder";

export const seedDatabase = async (db: NodePgDatabase<typeof schema>) => {
  const orgId = await seedOrganization(db);
  const userIds = await seedUser(db, orgId);
  const propertyIds = await seedProperty(db, orgId);
  const signalIds = await seedSignal(db, propertyIds);
  const taskIds = await seedTask(db, orgId, propertyIds, userIds, signalIds);
  await seedAlert(db, orgId, propertyIds, taskIds, signalIds);
  await seedReport(db, propertyIds, userIds);
  await seedTaskComment(db, taskIds, userIds);
  await seedTaskAttachment(db, taskIds, userIds);
  await seedConditionSnapshot(db, propertyIds);
  await seedPropertyIdentifier(db, propertyIds);
  await seedAlertSubscription(db, userIds, propertyIds);
  await seedIngestionJob(db, propertyIds);
  await seedApiCache(db);

  console.log("🌱 All tables seeded with sample data.");
};
