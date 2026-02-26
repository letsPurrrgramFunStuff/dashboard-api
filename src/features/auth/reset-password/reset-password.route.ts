import type { FastifyPluginAsync } from "fastify";

export const resetPasswordRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/forgot",
    {
      schema: { tags: ["Auth"], summary: "Request password reset email" },
    },
    async (_request, reply) => {
      return reply.send({
        message: "If that email exists, a reset link has been sent.",
      });
    },
  );
  fastify.post(
    "/confirm",
    {
      schema: { tags: ["Auth"], summary: "Reset password with token" },
    },
    async (_request, reply) => {
      return reply.send({ message: "Password reset successfully." });
    },
  );
};
