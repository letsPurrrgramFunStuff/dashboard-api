import { eq, isNull } from "drizzle-orm";
import { NycOpenDataClient } from "./nyc-open-data.client";
import {
  normalizePermit,
  normalizeViolation,
  normalize311Complaint,
} from "./nyc-open-data.normalizer";
import { signals, properties } from "@database/schema";

export class NycOpenDataService {
  private client: NycOpenDataClient;

  constructor() {
    this.client = new NycOpenDataClient();
  }

  async runDelta(data: { allProperties?: boolean; propertyId?: number }) {
    if (data.allProperties) {
      const allProperties = await fastify.db
        .select({ id: properties.id, bin: properties.bin, bbl: properties.bbl })
        .from(properties)
        .where(isNull(properties.deletedAt));

      for (const prop of allProperties) {
        if (prop.bin || prop.bbl) {
          await this.runForProperty(prop.id);
        }
      }
    } else if (data.propertyId) {
      await this.runForProperty(data.propertyId);
    }
  }

  async runForProperty(propertyId: number) {
    const [prop] = await fastify.db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!prop?.bin && !prop?.bbl) {
      console.warn(
        `Property ${propertyId} has no BIN/BBL — skipping NYC ingestion`,
      );
      return;
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (prop.bin) {
      const rawPermits = await this.client.fetchPermitsByBin(prop.bin, since);
      for (const raw of rawPermits) {
        const normalized = normalizePermit(
          propertyId,
          raw as Record<string, unknown>,
        );
        await this.upsertSignal(normalized);
      }
      const rawViolations = await this.client.fetchViolationsByBin(
        prop.bin,
        since,
      );
      for (const raw of rawViolations) {
        const normalized = normalizeViolation(
          propertyId,
          raw as Record<string, unknown>,
          "dob",
        );
        await this.upsertSignal(normalized);
      }
      const rawEcb = await this.client.fetchEcbViolationsByBin(prop.bin, since);
      for (const raw of rawEcb) {
        const normalized = normalizeViolation(
          propertyId,
          raw as Record<string, unknown>,
          "ecb",
        );
        await this.upsertSignal(normalized);
      }
    }

    if (prop.bbl) {
      const raw311 = await this.client.fetch311ComplaintsByBbl(prop.bbl, since);
      for (const raw of raw311) {
        const normalized = normalize311Complaint(
          propertyId,
          raw as Record<string, unknown>,
        );
        await this.upsertSignal(normalized);
      }
    }

    console.log(`✅ NYC ingestion complete for property ${propertyId}`);
  }

  private async upsertSignal(data: Partial<typeof signals.$inferInsert>) {
    if (!data.externalId) return;
    const existing = await fastify.db
      .select({ id: signals.id })
      .from(signals)
      .where(eq(signals.externalId, data.externalId))
      .limit(1);

    if (existing.length > 0) {
      await fastify.db
        .update(signals)
        .set({ ...data, updatedAt: new Date() } as Partial<
          typeof signals.$inferInsert
        >)
        .where(eq(signals.id, existing[0].id));
    } else {
      await fastify.db
        .insert(signals)
        .values(data as typeof signals.$inferInsert);
    }
  }
}
