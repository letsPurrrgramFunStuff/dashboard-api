import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";

export const adminRoute: FastifyPluginAsync = async (fastify) => {
  const adminAuth = {
    onRequest: [
      fastify.authenticate,
      fastify.requireRole("dashboard_ops", "admin"),
    ],
  };
  fastify.get(
    "/properties",
    {
      schema: {
        tags: ["Admin"],
        summary: "List all properties (admin)",
        security: [{ bearerAuth: [] }],
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.send({ data: [], total: 0 }),
  );
  fastify.post(
    "/properties/:id/refresh-all",
    {
      schema: {
        tags: ["Admin"],
        summary: "Force full data re-fetch for property",
        security: [{ bearerAuth: [] }],
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.send({ message: "Full refresh job enqueued" }),
  );
  fastify.get(
    "/ingestion-jobs",
    {
      schema: {
        tags: ["Admin"],
        summary: "List ingestion job history",
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          jobType: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          propertyId: Type.Optional(Type.Number()),
          page: Type.Optional(Type.Number({ default: 1 })),
          pageSize: Type.Optional(Type.Number({ default: 50 })),
        }),
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.send({ data: [], total: 0 }),
  );
  fastify.get(
    "/api-cache",
    {
      schema: {
        tags: ["Admin"],
        summary: "API cache stats",
        security: [{ bearerAuth: [] }],
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.send({ stats: [] }),
  );
  fastify.delete(
    "/api-cache/:provider",
    {
      schema: {
        tags: ["Admin"],
        summary: "Purge provider cache",
        security: [{ bearerAuth: [] }],
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.send({ message: "Cache purged" }),
  );
  fastify.post(
    "/provider-keys",
    {
      schema: {
        tags: ["Admin"],
        summary: "Add or update API provider key",
        security: [{ bearerAuth: [] }],
        body: Type.Object({
          provider: Type.String(),
          keyName: Type.String(),
          keyValue: Type.String(),
        }),
      },
      ...adminAuth,
    },
    async (_req, reply) => reply.status(200).send({ message: "Key saved" }),
  );
};
