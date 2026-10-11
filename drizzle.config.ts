import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString || "postgresql://postgres:postgres@localhost:5432/haidronics",
  },
});
