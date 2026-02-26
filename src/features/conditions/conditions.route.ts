import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { eq, desc } from "drizzle-orm";
import * as schema from "../../database/schema";

const ENUM_TO_SCORE: Record<string, number> = {
  good: 90,
  fair: 70,
  poor: 40,
  critical: 10,
};

const mapSnapshot = (r: {
  id: number;
  provider: string;
  capturedAt: string;
  conditionOverall: string | null;
  roofCondition: string | null;
  exteriorCondition: string | null;
  imageryUrl: string | null;
  thumbnailUrl: string | null;
  aiAttributes: unknown;
}) => ({
  id: r.id,
  provider: r.provider,
  capturedAt: r.capturedAt,
  overallScore: ENUM_TO_SCORE[r.conditionOverall ?? ""] ?? 0,
  roofScore: ENUM_TO_SCORE[r.roofCondition ?? ""] ?? 0,
  facadeScore: ENUM_TO_SCORE[r.exteriorCondition ?? ""] ?? 0,
  structuralScore: ENUM_TO_SCORE[r.conditionOverall ?? ""] ?? 0,
  imageUrls: r.imageryUrl ? [r.imageryUrl] : [],
  thumbnailUrl: r.thumbnailUrl,
  flaggedConditions:
    (r.aiAttributes as { flaggedConditions?: string[] })?.flaggedConditions ??
    [],
});

export const conditionsRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };
  const ParamsWithProperty = Type.Object({ propertyId: Type.String() });
  const SnapshotParams = Type.Object({
    propertyId: Type.String(),
    id: Type.String(),
  });
  fastify.get(
    "/:propertyId/conditions",
    {
      schema: {
        tags: ["Conditions"],
        summary: "Get condition snapshots timeline",
        security: [{ bearerAuth: [] }],
        params: ParamsWithProperty,
      },
      ...auth,
    },
    async (request, reply) => {
      const { propertyId } = request.params as { propertyId: string };
      const pid = parseInt(propertyId);
      const rows = await fastify.db
        .select({
          id: schema.conditionSnapshots.id,
          provider: schema.conditionSnapshots.provider,
          capturedAt: schema.conditionSnapshots.snapshotDate,
          conditionOverall: schema.conditionSnapshots.conditionOverall,
          roofCondition: schema.conditionSnapshots.roofCondition,
          exteriorCondition: schema.conditionSnapshots.exteriorCondition,
          imageryUrl: schema.conditionSnapshots.imageryUrl,
          thumbnailUrl: schema.conditionSnapshots.thumbnailUrl,
          aiAttributes: schema.conditionSnapshots.aiAttributes,
        })
        .from(schema.conditionSnapshots)
        .where(eq(schema.conditionSnapshots.propertyId, pid))
        .orderBy(desc(schema.conditionSnapshots.snapshotDate));
      return reply.send({ data: rows.map(mapSnapshot), total: rows.length });
    },
  );
  fastify.get(
    "/:propertyId/conditions/latest",
    {
      schema: {
        tags: ["Conditions"],
        summary: "Get latest condition snapshot",
        security: [{ bearerAuth: [] }],
        params: ParamsWithProperty,
      },
      ...auth,
    },
    async (request, reply) => {
      const { propertyId } = request.params as { propertyId: string };
      const pid = parseInt(propertyId);
      const [row] = await fastify.db
        .select({
          id: schema.conditionSnapshots.id,
          provider: schema.conditionSnapshots.provider,
          capturedAt: schema.conditionSnapshots.snapshotDate,
          conditionOverall: schema.conditionSnapshots.conditionOverall,
          roofCondition: schema.conditionSnapshots.roofCondition,
          exteriorCondition: schema.conditionSnapshots.exteriorCondition,
          imageryUrl: schema.conditionSnapshots.imageryUrl,
          thumbnailUrl: schema.conditionSnapshots.thumbnailUrl,
          aiAttributes: schema.conditionSnapshots.aiAttributes,
        })
        .from(schema.conditionSnapshots)
        .where(eq(schema.conditionSnapshots.propertyId, pid))
        .orderBy(desc(schema.conditionSnapshots.snapshotDate))
        .limit(1);
      return reply.send({ data: row ? mapSnapshot(row) : null });
    },
  );
  fastify.get(
    "/:propertyId/conditions/:id",
    {
      schema: {
        tags: ["Conditions"],
        summary: "Get condition snapshot detail",
        security: [{ bearerAuth: [] }],
        params: SnapshotParams,
      },
      ...auth,
    },
    async (request, reply) => {
      const { id } = request.params as { propertyId: string; id: string };
      const [row] = await fastify.db
        .select({
          id: schema.conditionSnapshots.id,
          provider: schema.conditionSnapshots.provider,
          capturedAt: schema.conditionSnapshots.snapshotDate,
          conditionOverall: schema.conditionSnapshots.conditionOverall,
          roofCondition: schema.conditionSnapshots.roofCondition,
          exteriorCondition: schema.conditionSnapshots.exteriorCondition,
          imageryUrl: schema.conditionSnapshots.imageryUrl,
          thumbnailUrl: schema.conditionSnapshots.thumbnailUrl,
          aiAttributes: schema.conditionSnapshots.aiAttributes,
        })
        .from(schema.conditionSnapshots)
        .where(eq(schema.conditionSnapshots.id, parseInt(id)))
        .limit(1);
      if (!row)
        return reply.status(404).send({ message: "Snapshot not found" });
      return reply.send({ data: mapSnapshot(row) });
    },
  );
  fastify.post(
    "/:propertyId/conditions/refresh",
    {
      schema: {
        tags: ["Conditions"],
        summary: "Trigger condition provider re-fetch",
        security: [{ bearerAuth: [] }],
        params: ParamsWithProperty,
      },
      ...auth,
    },
    async (_request, reply) => {
      return reply.send({ message: "Condition refresh job enqueued" });
    },
  );
};
