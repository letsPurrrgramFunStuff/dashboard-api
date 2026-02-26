import type { FastifyRequest, FastifyReply } from "fastify";
import { LoginRepository } from "./login.repository";
import type { Static } from "@sinclair/typebox";
import { LoginBodySchema } from "./login.schema";

type LoginBody = Static<typeof LoginBodySchema>;

export const loginController = async (
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) => {
  const { email, password } = request.body;
  const repo = new LoginRepository(fastify.db);

  const user = await repo.findActiveUserByEmail(email);
  if (!user || !user.isActive || user.deletedAt) {
    return reply.status(401).send({ message: "Invalid credentials" });
  }

  if (!repo.verifyPassword(password, user.passwordHash)) {
    return reply.status(401).send({ message: "Invalid credentials" });
  }

  await repo.updateLastLogin(user.id);

  const accessToken = fastify.jwt.sign(
    {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m" },
  );

  return reply.status(200).send({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
    },
    accessToken,
  });
};
