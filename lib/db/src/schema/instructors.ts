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
  avgTechnique: real("avg_technique").notNull().default(0),
  avgCommunication: real("avg_communication").notNull().default(0),
  avgPatience: real("avg_patience").notNull().default(0),
  avgAdaptability: real("avg_adaptability").notNull().default(0),
  avgExpertise: real("avg_expertise").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  publicRank: integer("public_rank"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInstructorSchema = createInsertSchema(instructorsTable).omit({ id: true, createdAt: true, updatedAt: true, avgScore: true, avgTechnique: true, avgCommunication: true, avgPatience: true, avgAdaptability: true, avgExpertise: true, reviewCount: true, publicRank: true });
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructorsTable.$inferSelect;
