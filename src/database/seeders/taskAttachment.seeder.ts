import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { taskAttachments } from "../schema";

export async function seedTaskAttachment(
  db: NodePgDatabase<any>,
  taskIds: number[],
  userIds: number[],
) {
  const attachmentData = Array.from({ length: 100 }).map(() => ({
    taskId: faker.helpers.arrayElement(taskIds),
    uploadedBy: faker.helpers.arrayElement(userIds),
    fileName: faker.system.fileName(),
    fileSize: faker.number.int({ min: 1000, max: 1000000 }),
    mimeType: faker.system.mimeType(),
    storageUrl: faker.internet.url(),
    createdAt: faker.date.recent(),
  }));
  await db.insert(taskAttachments).values(attachmentData);
}
