import type { FastifyPluginAsync } from "fastify";

export const registerAuthMiddleware = (
  fastify: import("fastify").FastifyInstance,
) => {
  fastify.decorate(
    "authenticate",
    async (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ message: "Unauthorized" });
      }
    },
  );

  fastify.decorate(
    "requireRole",
    (...roles: string[]) =>
      async (
        request: import("fastify").FastifyRequest,
        reply: import("fastify").FastifyReply,
      ) => {
        const user = request.user as { role: string } | undefined;
        if (!user || !roles.includes(user.role)) {
          return reply
            .status(403)
            .send({ message: "Forbidden: insufficient role" });
        }
      },
  );
};
