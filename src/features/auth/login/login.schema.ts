import { Type } from "@sinclair/typebox";

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

export const LoginResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.Number(),
    email: Type.String(),
    firstName: Type.Optional(Type.String()),
    lastName: Type.Optional(Type.String()),
    role: Type.String(),
    organizationId: Type.Number(),
  }),
  accessToken: Type.String(),
});
