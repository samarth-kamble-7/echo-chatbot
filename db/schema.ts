import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id"),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: text("created_at").default(sql`now()`),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(), // Clerk org ID: org_...
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // Auto-generated slug (e.g. acme-support)
  logo: text("logo"),
  website: text("website"),
  createdAt: text("created_at").default(sql`now()`),
});
