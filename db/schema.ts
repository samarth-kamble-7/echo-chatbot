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
