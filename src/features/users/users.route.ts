import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";

export const usersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      return reply.send({ id: parseInt(sub), message: "TODO: implement" });
    },
  );
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users in organization",
        security: [{ bearerAuth: [] }],
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.send({ data: [], total: 0 });
    },
  );
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "Invite a new user",
        security: [{ bearerAuth: [] }],
        body: Type.Object({
          email: Type.String({ format: "email" }),
          firstName: Type.Optional(Type.String()),
          lastName: Type.Optional(Type.String()),
          role: Type.Enum({
            admin: "admin",
            manager: "manager",
            viewer: "viewer",
          }),
        }),
      },
      onRequest: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.status(201).send({ message: "Invitation sent" });
    },
  );
};
