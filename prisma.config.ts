import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use session pooler (port 5432 on pooler host) for CLI —
    // same host as transaction pooler but without pgbouncer=true.
    url: process.env["DIRECT_URL"],
  },
});
