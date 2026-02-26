import type { FastifyPluginAsync } from "fastify";

export const logoutRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Auth"],
        summary: "Logout current user",
        security: [{ bearerAuth: [] }],
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      reply.clearCookie("refreshToken");
      return reply.send({ message: "Logged out successfully" });
    },
  );
};
