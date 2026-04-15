import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local the same way Next.js does
loadEnvConfig(path.resolve(__dirname));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // Use direct connection for all Prisma CLI operations (migrate, push, studio)
    // The app runtime uses DATABASE_URL (pgBouncer pooler) via src/lib/db/client.ts
    url: process.env.DIRECT_URL!,
  },
});
