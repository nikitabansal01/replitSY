import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const onboardingData = pgTable("onboarding_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  age: text("age").notNull(),
  gender: text("gender").notNull(),
  height: text("height"),
  weight: text("weight"),
  diet: text("diet").notNull(),
  symptoms: jsonb("symptoms").notNull().$type<string[]>(),
  goals: jsonb("goals").$type<string[]>(),
  lifestyle: jsonb("lifestyle").$type<Record<string, any>>(),
  medicalConditions: jsonb("medical_conditions").$type<string[]>(),
  medications: jsonb("medications").$type<string[]>(),
  allergies: jsonb("allergies").$type<string[]>(),
  menstrualCycle: jsonb("menstrual_cycle").$type<Record<string, any>>(),
  stressLevel: text("stress_level"),
  sleepHours: text("sleep_hours"),
  exerciseLevel: text("exercise_level"),
  waterIntake: text("water_intake"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  ingredients: jsonb("ingredients").$type<IngredientRecommendation[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingSchema = createInsertSchema(onboardingData).omit({
  id: true,
  completedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OnboardingData = typeof onboardingData.$inferSelect;
export type InsertOnboardingData = z.infer<typeof insertOnboardingSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export interface IngredientRecommendation {
  name: string;
  description: string;
  emoji: string;
  lazy: string;
  tasty: string;
  healthy: string;
}

export interface ChatResponse {
  message: string;
  ingredients: IngredientRecommendation[];
}
