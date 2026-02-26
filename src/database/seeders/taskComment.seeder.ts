import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { taskComments } from "../schema";

export async function seedTaskComment(
  db: NodePgDatabase<any>,
  taskIds: number[],
  userIds: number[],
) {
  const commentData = Array.from({ length: 100 }).map(() => ({
    taskId: faker.helpers.arrayElement(taskIds),
    authorId: faker.helpers.arrayElement(userIds),
    body: faker.lorem.sentences(2),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
    deletedAt: null,
  }));
  await db.insert(taskComments).values(commentData);
}
