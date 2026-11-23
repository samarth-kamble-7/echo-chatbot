import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "";
  if (!url) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, "utf-8");
        const match = envFile.match(/DATABASE_URL=["']?([^"'\n\r]+)["']?/);
        if (match && match[1]) {
          url = match[1].trim();
        }
      }
    } catch {
      // ignore
    }
  }

  // Strip parameters that can cause issues with serverless HTTP driver
  return url.replace(/([?&])channel_binding=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");
}

const connectionString = getDatabaseUrl();
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
