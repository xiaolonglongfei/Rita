import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  instructorId: integer("instructor_id").notNull(),
  sessionId: integer("session_id"),
  value: real("value").notNull(),
  effectiveness: real("effectiveness").notNull(),
  punctuality: real("punctuality").notNull(),
  overallScore: real("overall_score").notNull(),
  comment: text("comment"),
  status: text("status").notNull().default("pending"),
  moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true, status: true, moderationNote: true, overallScore: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
