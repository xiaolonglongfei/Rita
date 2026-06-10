import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instructorsTable = pgTable("instructors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  specialty: text("specialty").notNull(),
  photoUrl: text("photo_url"),
  location: text("location"),
  verified: boolean("verified").notNull().default(false),
  avgScore: real("avg_score").notNull().default(0),
  avgValue: real("avg_value").notNull().default(0),
  avgEffectiveness: real("avg_effectiveness").notNull().default(0),
  avgPunctuality: real("avg_punctuality").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  publicRank: integer("public_rank"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInstructorSchema = createInsertSchema(instructorsTable).omit({ id: true, createdAt: true, updatedAt: true, avgScore: true, avgValue: true, avgEffectiveness: true, avgPunctuality: true, reviewCount: true, publicRank: true });
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructorsTable.$inferSelect;
