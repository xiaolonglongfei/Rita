import { pgTable, text, serial, timestamp, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  instructorId: integer("instructor_id").notNull(),
  sessionDate: date("session_date", { mode: "string" }).notNull(),
  verified: boolean("verified").notNull().default(false),
  verificationCode: text("verification_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, updatedAt: true, verified: true, verificationCode: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
