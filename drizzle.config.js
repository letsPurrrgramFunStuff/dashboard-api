import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/database/migrations",
  schema: "./src/database/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  migration: {
    table: "migrations",
    schema: "public",
  },
});
