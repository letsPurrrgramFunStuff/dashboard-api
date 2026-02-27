import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

let pool: Pool;

export const registerDatabase = async () => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error(
      "DB_HOST, DB_NAME, DB_USER and DB_PASSWORD environment variables are required",
    );
  }

  pool = new Pool({
    host: DB_HOST,
    port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
  });

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
