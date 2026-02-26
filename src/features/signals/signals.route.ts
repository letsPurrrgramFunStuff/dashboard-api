import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import * as schema from "../../database/schema";

export const signalsRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };
  const ParamsWithProperty = Type.Object({ propertyId: Type.String() });
  const SignalParams = Type.Object({
    propertyId: Type.String(),
    id: Type.String(),
  });
  const SignalQuery = Type.Object({
    page: Type.Optional(Type.Number({ default: 1 })),
    pageSize: Type.Optional(Type.Number({ default: 25 })),
    signalType: Type.Optional(Type.String()),
    source: Type.Optional(Type.String()),
    status: Type.Optional(Type.String()),
    severity: Type.Optional(Type.String()),
    dateFrom: Type.Optional(Type.String()),
    dateTo: Type.Optional(Type.String()),
  });
  fastify.get(
    "/:propertyId/signals",
    {
      schema: {
        tags: ["Signals"],
        summary: "Get signals timeline for a property",
        security: [{ bearerAuth: [] }],
        params: ParamsWithProperty,
        querystring: SignalQuery,
      },
      ...auth,
    },
    async (request, reply) => {
      const { propertyId } = request.params as { propertyId: string };
      const q = request.query as {
        page?: number;
        pageSize?: number;
        signalType?: string;
        source?: string;
        status?: string;
        severity?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      const pid = parseInt(propertyId);
      const page = Math.max(1, q.page ?? 1);
      const pageSize = Math.min(100, q.pageSize ?? 25);
      const offset = (page - 1) * pageSize;

      const conditions: ReturnType<typeof eq>[] = [
        eq(schema.signals.propertyId, pid),
      ];
      if (q.signalType)
        conditions.push(eq(schema.signals.signalType, q.signalType as never));
      if (q.source)
        conditions.push(eq(schema.signals.source, q.source as never));
      if (q.status) conditions.push(eq(schema.signals.status, q.status));
      if (q.severity)
        conditions.push(eq(schema.signals.severity, q.severity as never));
      if (q.dateFrom)
        conditions.push(gte(schema.signals.eventDate, q.dateFrom));
      if (q.dateTo) conditions.push(lte(schema.signals.eventDate, q.dateTo));

      const [rows, [{ total }]] = await Promise.all([
        fastify.db
          .select({
            id: schema.signals.id,
            signalType: schema.signals.signalType,
            source: schema.signals.source,
            severity: schema.signals.severity,
            summary: schema.signals.title,
            status: schema.signals.status,
            capturedAt: schema.signals.createdAt,
            eventDate: schema.signals.eventDate,
          })
          .from(schema.signals)
          .where(and(...conditions))
          .orderBy(desc(schema.signals.eventDate))
          .limit(pageSize)
          .offset(offset),
        fastify.db
          .select({ total: count() })
          .from(schema.signals)
          .where(and(...conditions)),
      ]);

      return reply.send({ data: rows, total: Number(total), page, pageSize });
    },
  );
  fastify.get(
    "/:propertyId/signals/:id",
    {
      schema: {
        tags: ["Signals"],
        summary: "Get signal detail",
        security: [{ bearerAuth: [] }],
        params: SignalParams,
      },
      ...auth,
    },
    async (request, reply) => {
      const { id } = request.params as { propertyId: string; id: string };
      const [row] = await fastify.db
        .select({
          id: schema.signals.id,
          signalType: schema.signals.signalType,
          source: schema.signals.source,
          severity: schema.signals.severity,
          summary: schema.signals.title,
          description: schema.signals.description,
          status: schema.signals.status,
          capturedAt: schema.signals.createdAt,
          eventDate: schema.signals.eventDate,
        })
        .from(schema.signals)
        .where(eq(schema.signals.id, parseInt(id)))
        .limit(1);
      if (!row) return reply.status(404).send({ message: "Signal not found" });
      return reply.send({ data: row });
    },
  );
  fastify.post(
    "/:propertyId/signals",
    {
      schema: {
        tags: ["Signals"],
        summary: "Create a manual signal entry",
        security: [{ bearerAuth: [] }],
        params: ParamsWithProperty,
        body: Type.Object({
          signalType: Type.String(),
          title: Type.String(),
          description: Type.Optional(Type.String()),
          eventDate: Type.Optional(Type.String()),
          severity: Type.Optional(Type.String()),
        }),
      },
      ...auth,
    },
    async (_request, reply) => {
      return reply.status(201).send({ message: "Signal created" });
    },
  );
};
