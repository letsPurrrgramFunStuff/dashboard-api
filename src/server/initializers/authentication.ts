import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { registerAuthMiddleware } from "../../features/auth/auth.middleware";

export const registerAuthentication = () => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret",
    cookie: {
      cookieName: "refreshToken",
      signed: false,
    },
  });
  fastify.register(fastifyCookie);
  registerAuthMiddleware(fastify);
};

export const registerCors = () => {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : null;

  fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins) {
        return allowedOrigins.includes(origin)
          ? cb(null, true)
          : cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  });
};
