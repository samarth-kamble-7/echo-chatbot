import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, vector } from "drizzle-orm/pg-core";

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
  docsUrl: text("docs_url"),
  createdAt: text("created_at").default(sql`now()`),
});

export const knowledgeSource = pgTable("knowledge_source", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "url" | "file" | "text"
  sourceUrl: text("source_url"),
  fileId: text("file_id"), // ImageKit fileId for uploaded binary files (e.g. PDFs)
  status: text("status").notNull().default("processing"), // "pending" | "processing" | "ready" | "error"
  chunkCount: integer("chunk_count").notNull().default(0),
  errorMessage: text("error_message"),
  lastSyncedAt: text("last_synced_at").default(sql`now()`),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const knowledgeChunk = pgTable("knowledge_chunk", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => knowledgeSource.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull().default(0),
  embedding: vector("embedding", { dimensions: 768 }),
  metadata: jsonb("metadata").$type<{
    title?: string;
    sourceUrl?: string;
    heading?: string;
  }>(),
  createdAt: text("created_at").default(sql`now()`),
});

export type KnowledgeSource = typeof knowledgeSource.$inferSelect;
export type NewKnowledgeSource = typeof knowledgeSource.$inferInsert;
export type KnowledgeChunk = typeof knowledgeChunk.$inferSelect;

export const section = pgTable("section", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  tone: text("tone").notNull().default("professional"), // "professional" | "friendly" | "concise" | "technical"
  instructions: text("instructions"),
  allowedTopics: jsonb("allowed_topics").$type<string[]>().notNull().default([]),
  blockedTopics: jsonb("blocked_topics").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const sectionKnowledgeSource = pgTable("section_knowledge_source", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => section.id, { onDelete: "cascade" }),
  sourceId: text("source_id")
    .notNull()
    .references(() => knowledgeSource.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`now()`),
});

export type Section = typeof section.$inferSelect;
export type NewSection = typeof section.$inferInsert;

export const chatbotSettings = pgTable("chatbot_settings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  botName: text("bot_name").notNull().default("Echo Support"),
  subtitle: text("subtitle").notNull().default("Online"),
  welcomeMessage: text("welcome_message")
    .notNull()
    .default("Hi! Ask me anything about our documentation."),
  inputPlaceholder: text("input_placeholder")
    .notNull()
    .default("Ask a question..."),
  primaryColor: text("primary_color").notNull().default("#10b981"),
  theme: text("theme").notNull().default("dark"), // "dark" | "light"
  position: text("position").notNull().default("bottom-right"), // "bottom-right" | "bottom-left"
  launcherIcon: text("launcher_icon").notNull().default("message"), // "message" | "bot" | "headphones" | "help"
  launcherStyle: text("launcher_style").notNull().default("icon"), // "icon" | "pill"
  launcherText: text("launcher_text").notNull().default("Chat with us"),
  suggestedQuestions: jsonb("suggested_questions")
    .$type<string[]>()
    .notNull()
    .default([]),
  supportEmail: text("support_email"),
  systemPrompt: text("system_prompt"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export type ChatbotSettings = typeof chatbotSettings.$inferSelect;
