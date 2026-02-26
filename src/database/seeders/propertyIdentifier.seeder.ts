import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { propertyIdentifiers } from "../schema";

export async function seedPropertyIdentifier(
  db: NodePgDatabase<any>,
  propertyIds: number[],
) {
  const PROVIDERS = [
    "nyc_open_data",
    "lightbox",
    "attom",
    "locatenyc",
    "nearmap",
    "eagleview",
    "perilpulse",
  ] as const;
  const identifierData = Array.from({ length: 100 }).map(() => ({
    propertyId: faker.helpers.arrayElement(propertyIds),
    provider: faker.helpers.arrayElement(PROVIDERS),
    providerKey: faker.string.alphanumeric(8),
    providerValue: faker.string.alphanumeric(12),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  }));
  await db.insert(propertyIdentifiers).values(identifierData);
}
