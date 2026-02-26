import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { apiCache } from "../schema";

export async function seedApiCache(db: NodePgDatabase<any>) {
  const PROVIDERS = [
    "nyc_open_data",
    "lightbox",
    "attom",
    "locatenyc",
    "nearmap",
    "eagleview",
    "perilpulse",
  ] as const;
  const cacheData = Array.from({ length: 100 }).map(() => ({
    provider: faker.helpers.arrayElement(PROVIDERS),
    cacheKey: faker.string.alphanumeric(12),
    payload: { data: faker.lorem.sentence() },
    expiresAt: faker.date.soon(),
    createdAt: faker.date.recent(),
  }));
  await db.insert(apiCache).values(cacheData);
}
