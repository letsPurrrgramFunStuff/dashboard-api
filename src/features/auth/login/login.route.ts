import type { FastifyPluginAsync } from "fastify";
import { loginController } from "./login.controller";
import { LoginBodySchema, LoginResponseSchema } from "./login.schema";

export const loginRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login with email and password",
        body: LoginBodySchema,
        response: { 200: LoginResponseSchema },
      },
    },
    loginController,
  );
};
