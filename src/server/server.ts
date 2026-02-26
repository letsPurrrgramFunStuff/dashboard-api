import Fastify, { FastifyInstance } from "fastify";
import dotenv from "dotenv";
import qs from "qs";
import { registerDatabase } from "@database/database";
import {
  registerAuthentication,
  registerCors,
} from "./initializers/authentication";
import { registerDocumentation } from "./initializers/documentation";
import { registerValidationPlugins } from "./initializers/plugins";
import { registerRepositories } from "./initializers/repositories";
import { registerRoutes } from "./initializers/routes";
import { initializeQueues } from "../ingestion/queue";
import { execSync } from "child_process";

declare global {
  var fastify: FastifyInstance;
}

const createFastifyInstance = () => {
  return Fastify({
    logger: true,
    routerOptions: {
      querystringParser: (str) => qs.parse(str),
    },
  });
};

const registerFastifyAsGlobal = () => {
  const fastify: FastifyInstance = createFastifyInstance();
  global.fastify = fastify;
};

const registerGracefulShutdown = () => {
  const listeners = ["SIGINT", "SIGTERM"];
  listeners.forEach((signal) => {
    process.on(signal, async () => {
      await fastify.close();
      process.exit(0);
    });
  });
};

const startServer = async () => {
  try {
    if (!process.env.PORT) {
      throw new Error(
        "PORT environment variable is required and must be a valid number",
      );
    }
    const host = "0.0.0.0";
    const port = parseInt(process.env.PORT, 10);
    const maxAttempts = 2;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        await fastify.listen({ host, port });
        console.log(`🚀 Dashboard API running on port ${port}`);
        break;
      } catch (err: any) {
        if (err && err.code === "EADDRINUSE" && attempt === 0) {
          fastify.log.warn(
            `Port ${port} is in use — attempting to free it before retrying`,
          );
          try {
            const platform = process.platform;
            if (platform === "win32") {
              const out = execSync(`netstat -ano | findstr :${port}`, {
                encoding: "utf8",
              });
              const pids = Array.from(
                new Set(
                  out
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((l) => l.split(/\s+/).pop() as string),
                ),
              );
              for (const pid of pids) {
                try {
                  execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
                  fastify.log.info(`Killed process ${pid} on port ${port}`);
                } catch (killErr) {
                  fastify.log.warn(
                    `Failed to kill PID ${pid}: ${String(killErr)}`,
                  );
                }
              }
            } else {
              const out = execSync(`lsof -i :${port} -t || true`, {
                encoding: "utf8",
              });
              const pids = out
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              for (const pid of pids) {
                try {
                  execSync(`kill -9 ${pid}`, { stdio: "ignore" });
                  fastify.log.info(`Killed process ${pid} on port ${port}`);
                } catch (killErr) {
                  fastify.log.warn(
                    `Failed to kill PID ${pid}: ${String(killErr)}`,
                  );
                }
              }
            }
          } catch (discoverErr) {
            fastify.log.warn(
              `Unable to free port ${port}: ${String(discoverErr)}`,
            );
          }
          attempt++;
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        fastify.log.error(err);
        process.exit(1);
      }
    }
  } catch (e) {
    fastify.log.error(e);
    process.exit(1);
  }
};

export const initializeServer = async () => {
  try {
    dotenv.config();
    registerFastifyAsGlobal();
    registerGracefulShutdown();
    registerAuthentication();
    registerCors();
    registerRepositories();
    registerDocumentation();
    registerValidationPlugins();
    registerRoutes();
    await registerDatabase();
    initializeQueues();
    await startServer();
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};
