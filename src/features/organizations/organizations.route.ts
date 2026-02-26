import type { FastifyPluginAsync } from "fastify";

export const organizationsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Organizations"],
        summary: "Get own organization",
        security: [{ bearerAuth: [] }],
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.send({ data: null });
    },
  );

  fastify.put(
    "/",
    {
      schema: {
        tags: ["Organizations"],
        summary: "Update organization settings",
        security: [{ bearerAuth: [] }],
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.send({ message: "Updated" });
    },
  );

  fastify.get(
    "/members",
    {
      schema: {
        tags: ["Organizations"],
        summary: "List organization members",
        security: [{ bearerAuth: [] }],
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.send({ data: [], total: 0 });
    },
  );
};
