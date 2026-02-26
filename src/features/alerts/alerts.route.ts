import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { eq, and, desc, count, isNull } from "drizzle-orm";
import * as schema from "../../database/schema";

export const alertsRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };

  const AlertQuery = Type.Object({
    page: Type.Optional(Type.Number({ default: 1 })),
    pageSize: Type.Optional(Type.Number({ default: 25 })),
    propertyId: Type.Optional(Type.Number()),
    alertType: Type.Optional(Type.String()),
    isRead: Type.Optional(Type.Boolean()),
  });
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Alerts"],
        summary: "List alerts",
        security: [{ bearerAuth: [] }],
        querystring: AlertQuery,
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      const q = req.query as {
        page?: number;
        pageSize?: number;
        propertyId?: number;
        alertType?: string;
        isRead?: boolean;
      };
      const page = Math.max(1, q.page ?? 1);
      const pageSize = Math.min(100, q.pageSize ?? 25);
      const offset = (page - 1) * pageSize;

      const conditions = [
        eq(schema.alerts.organizationId, organizationId),
        isNull(schema.alerts.dismissedAt),
        ...(q.propertyId != null
          ? [eq(schema.alerts.propertyId, q.propertyId)]
          : []),
        ...(q.isRead != null ? [eq(schema.alerts.isRead, q.isRead)] : []),
      ];

      const [data, [{ total }], [{ unreadCount }]] = await Promise.all([
        fastify.db
          .select({
            id: schema.alerts.id,
            alertType: schema.alerts.alertType,
            message: schema.alerts.title,
            severity: schema.alerts.severity,
            isRead: schema.alerts.isRead,
            propertyId: schema.alerts.propertyId,
            propertyName: schema.properties.name,
            createdAt: schema.alerts.createdAt,
          })
          .from(schema.alerts)
          .leftJoin(
            schema.properties,
            eq(schema.alerts.propertyId, schema.properties.id),
          )
          .where(and(...conditions))
          .orderBy(desc(schema.alerts.createdAt))
          .limit(pageSize)
          .offset(offset),
        fastify.db
          .select({ total: count() })
          .from(schema.alerts)
          .where(and(...conditions)),
        fastify.db
          .select({ unreadCount: count() })
          .from(schema.alerts)
          .where(
            and(
              eq(schema.alerts.organizationId, organizationId),
              eq(schema.alerts.isRead, false),
              isNull(schema.alerts.dismissedAt),
            ),
          ),
      ]);

      return reply.send({
        data,
        total: Number(total),
        unreadCount: Number(unreadCount),
        page,
        pageSize,
      });
    },
  );
  fastify.put(
    "/:id/read",
    {
      schema: {
        tags: ["Alerts"],
        summary: "Mark alert as read",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await fastify.db
        .update(schema.alerts)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(schema.alerts.id, parseInt(id)));
      return reply.send({ message: "Marked as read" });
    },
  );
  fastify.put(
    "/:id/dismiss",
    {
      schema: {
        tags: ["Alerts"],
        summary: "Dismiss alert",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await fastify.db
        .update(schema.alerts)
        .set({ isDismissed: true, dismissedAt: new Date() })
        .where(eq(schema.alerts.id, parseInt(id)));
      return reply.send({ message: "Dismissed" });
    },
  );
  fastify.put(
    "/read-all",
    {
      schema: {
        tags: ["Alerts"],
        summary: "Mark all alerts as read",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      await fastify.db
        .update(schema.alerts)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(schema.alerts.organizationId, organizationId),
            eq(schema.alerts.isRead, false),
          ),
        );
      return reply.send({ message: "All marked as read" });
    },
  );
  fastify.get(
    "/subscriptions",
    {
      schema: {
        tags: ["Alerts"],
        summary: "Get alert subscriptions",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (_req, reply) => reply.send({ data: [] }),
  );
  fastify.put(
    "/subscriptions",
    {
      schema: {
        tags: ["Alerts"],
        summary: "Update alert subscriptions",
        security: [{ bearerAuth: [] }],
        body: Type.Array(
          Type.Object({
            alertType: Type.String(),
            channel: Type.String(),
            propertyId: Type.Optional(Type.Number()),
            isActive: Type.Boolean(),
          }),
        ),
      },
      ...auth,
    },
    async (_req, reply) => reply.send({ message: "Subscriptions updated" }),
  );
};
