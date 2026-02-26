import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

let pool: Pool;

export const registerDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const client = await pool.connect();
  client.release();

  const db = drizzle(pool, { schema });

  const migrationsFolder = path.join(__dirname, "migrations");
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
    migrationsSchema: "public",
  });
  console.log("✅ Database migrations applied");

  await seedDatabase(db);

  fastify.decorate("db", db);
  console.log("✅ Database connected");
};

export type Database = ReturnType<typeof drizzle<typeof schema>>;
