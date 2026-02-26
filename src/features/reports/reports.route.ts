import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { eq, and, desc, count } from "drizzle-orm";
import * as schema from "../../database/schema";

export const reportsRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };
  fastify.post(
    "/owner-pack",
    {
      schema: {
        tags: ["Reports"],
        summary: "Generate Owner Pack PDF",
        security: [{ bearerAuth: [] }],
        body: Type.Object({
          propertyId: Type.Number(),
          reportType: Type.Optional(Type.String()),
          periodStart: Type.Optional(Type.String({ format: "date" })),
          periodEnd: Type.Optional(Type.String({ format: "date" })),
        }),
      },
      ...auth,
    },
    async (req, reply) => {
      const body = req.body as {
        propertyId: number;
        reportType?: string;
        periodStart?: string;
        periodEnd?: string;
      };
      const { id: generatedBy } = req.user as { id: number };
      const today = new Date();
      const ninetyDaysAgo = new Date(
        today.getTime() - 90 * 24 * 60 * 60 * 1000,
      );
      const periodEnd = body.periodEnd ?? today.toISOString().split("T")[0];
      const periodStart =
        body.periodStart ?? ninetyDaysAgo.toISOString().split("T")[0];

      const validReportTypes = ["owner_pack", "insurance_packet"] as const;
      const reportType: (typeof validReportTypes)[number] =
        validReportTypes.includes(
          body.reportType as (typeof validReportTypes)[number],
        )
          ? (body.reportType as (typeof validReportTypes)[number])
          : "owner_pack";

      const [inserted] = await fastify.db
        .insert(schema.reports)
        .values({
          propertyId: body.propertyId,
          generatedBy,
          reportType,
          periodStart,
          periodEnd,
          storageUrl: null,
          fileName: null,
        })
        .returning({ id: schema.reports.id });

      return reply
        .status(202)
        .send({ message: "Report generation started", reportId: inserted.id });
    },
  );
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Reports"],
        summary: "List generated reports",
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          propertyId: Type.Optional(Type.Number()),
          page: Type.Optional(Type.Number({ default: 1 })),
          pageSize: Type.Optional(Type.Number({ default: 25 })),
        }),
      },
      ...auth,
    },
    async (req, reply) => {
      const q = req.query as {
        propertyId?: number;
        page?: number;
        pageSize?: number;
      };
      const page = Math.max(1, q.page ?? 1);
      const pageSize = Math.min(100, q.pageSize ?? 25);
      const offset = (page - 1) * pageSize;

      const conditions: ReturnType<typeof eq>[] = [];
      if (q.propertyId != null)
        conditions.push(eq(schema.reports.propertyId, q.propertyId));

      const [rows, [{ total }]] = await Promise.all([
        fastify.db
          .select({
            id: schema.reports.id,
            propertyId: schema.reports.propertyId,
            reportType: schema.reports.reportType,
            periodStart: schema.reports.periodStart,
            periodEnd: schema.reports.periodEnd,
            storageUrl: schema.reports.storageUrl,
            fileName: schema.reports.fileName,
            createdAt: schema.reports.createdAt,
          })
          .from(schema.reports)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.reports.createdAt))
          .limit(pageSize)
          .offset(offset),
        fastify.db
          .select({ total: count() })
          .from(schema.reports)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      const data = rows.map((r) => ({
        ...r,
        status: r.storageUrl ? "completed" : "pending",
        generatedAt: r.createdAt,
      }));

      return reply.send({ data, total: Number(total), page, pageSize });
    },
  );
  fastify.get(
    "/:id/download",
    {
      schema: {
        tags: ["Reports"],
        summary: "Download report PDF",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (_req, reply) => {
      return reply
        .status(404)
        .send({ message: "Report not found or not ready" });
    },
  );
};
