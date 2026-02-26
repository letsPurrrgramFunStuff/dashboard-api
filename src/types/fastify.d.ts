import "fastify";
import type { Database } from "../database/database";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
    requireRole: (
      ...roles: string[]
    ) => (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      id: number;
      email: string;
      role: string;
      organizationId: number;
    };
  }
}

declare module "dotenv";
