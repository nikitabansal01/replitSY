import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface MealItem {
  name: string;
  ingredients: string[];
  preparation_time: string;
  cooking_method: string;
  nutritional_focus: string[];
  health_benefits: string[];
  cultural_authenticity: string;
}

export interface DailyGuidelines {
  foods_to_emphasize: string[];
  foods_to_limit: string[];
  hydration_tips: string[];
  timing_recommendations: string[];
  cycle_support?: string[];
}

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

export interface CheckInResponse {
  message: string;
  followUpQuestions: string[];
  adaptiveRecommendations?: string[];
}

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
  height: text("height"),
  weight: text("weight"),
  diet: text("diet").notNull(),
  symptoms: jsonb("symptoms").notNull().$type<string[]>(),
  goals: jsonb("goals").$type<string[]>(),
  lifestyle: jsonb("lifestyle").$type<Record<string, any>>(),
  medicalConditions: jsonb("medical_conditions").$type<string[]>(),
  medications: jsonb("medications").$type<string[]>(),
  allergies: jsonb("allergies").$type<string[]>(),
  lastPeriodDate: text("last_period_date"),
  cycleLength: text("cycle_length"),
  periodLength: text("period_length"),
  irregularPeriods: boolean("irregular_periods").default(false),
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

export const dailyMealPlans = pgTable("daily_meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  menstrualPhase: text("menstrual_phase").notNull(),
  breakfast: jsonb("breakfast").$type<MealItem>().notNull(),
  lunch: jsonb("lunch").$type<MealItem>().notNull(),
  dinner: jsonb("dinner").$type<MealItem>().notNull(),
  snacks: jsonb("snacks").$type<MealItem[]>().notNull(),
  dailyGuidelines: jsonb("daily_guidelines").$type<DailyGuidelines>().notNull(),
  shoppingList: jsonb("shopping_list").$type<Record<string, string[]>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyFeedback = pgTable("daily_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mealPlanId: integer("meal_plan_id").notNull().references(() => dailyMealPlans.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  followedPlan: boolean("followed_plan"),
  enjoyedMeals: jsonb("enjoyed_meals").$type<string[]>(), // ['breakfast', 'lunch', 'dinner']
  dislikedMeals: jsonb("disliked_meals").$type<string[]>(),
  symptomsImprovement: jsonb("symptoms_improvement").$type<Record<string, number>>(), // symptom -> rating 1-5
  energyLevel: integer("energy_level"), // 1-5 scale
  digestiveHealth: integer("digestive_health"), // 1-5 scale
  moodRating: integer("mood_rating"), // 1-5 scale
  feedback: text("feedback"), // Free text feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressTracking = pgTable("progress_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  symptomsSeverity: jsonb("symptoms_severity").$type<Record<string, number>>(), // symptom -> severity 1-5
  menstrualPhase: text("menstrual_phase").notNull(),
  overallWellbeing: integer("overall_wellbeing"), // 1-5 scale
  notes: text("notes"),
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

export const insertDailyMealPlanSchema = createInsertSchema(dailyMealPlans).omit({
  id: true,
  createdAt: true,
});

export const insertDailyFeedbackSchema = createInsertSchema(dailyFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertProgressTrackingSchema = createInsertSchema(progressTracking).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OnboardingData = typeof onboardingData.$inferSelect;
export type InsertOnboardingData = z.infer<typeof insertOnboardingSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type DailyMealPlan = typeof dailyMealPlans.$inferSelect;
export type InsertDailyMealPlan = z.infer<typeof insertDailyMealPlanSchema>;
export type DailyFeedback = typeof dailyFeedback.$inferSelect;
export type InsertDailyFeedback = z.infer<typeof insertDailyFeedbackSchema>;
export type ProgressTracking = typeof progressTracking.$inferSelect;
export type InsertProgressTracking = z.infer<typeof insertProgressTrackingSchema>;
