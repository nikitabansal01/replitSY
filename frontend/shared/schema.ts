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

// Frontend-only schemas (without database dependencies)
export const userSchema = z.object({
  id: z.number(),
  firebaseUid: z.string(),
  email: z.string(),
  name: z.string(),
  profilePicture: z.string().optional(),
  createdAt: z.string(),
});

export const onboardingDataSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  age: z.string(),
  height: z.string().optional(),
  weight: z.string().optional(),
  diet: z.string(),
  symptoms: z.array(z.string()),
  goals: z.array(z.string()).optional(),
  lifestyle: z.record(z.any()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  lastPeriodDate: z.string().optional(),
  cycleLength: z.string().optional(),
  periodLength: z.string().optional(),
  irregularPeriods: z.boolean().optional(),
  stressLevel: z.string().optional(),
  sleepHours: z.string().optional(),
  exerciseLevel: z.string().optional(),
  completedAt: z.date().optional(),
});

export const chatMessageSchema = z.object({
  id: z.number(),
  userId: z.number(),
  message: z.string(),
  response: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    description: z.string(),
    emoji: z.string(),
    lazy: z.string(),
    tasty: z.string(),
    healthy: z.string(),
  })).optional(),
  createdAt: z.string(),
});

export const dailyMealPlanSchema = z.object({
  id: z.number(),
  userId: z.number(),
  date: z.string(),
  menstrualPhase: z.string(),
  breakfast: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    preparation_time: z.string(),
    cooking_method: z.string(),
    nutritional_focus: z.array(z.string()),
    health_benefits: z.array(z.string()),
    cultural_authenticity: z.string(),
  }),
  lunch: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    preparation_time: z.string(),
    cooking_method: z.string(),
    nutritional_focus: z.array(z.string()),
    health_benefits: z.array(z.string()),
    cultural_authenticity: z.string(),
  }),
  dinner: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    preparation_time: z.string(),
    cooking_method: z.string(),
    nutritional_focus: z.array(z.string()),
    health_benefits: z.array(z.string()),
    cultural_authenticity: z.string(),
  }),
  snacks: z.array(z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    preparation_time: z.string(),
    cooking_method: z.string(),
    nutritional_focus: z.array(z.string()),
    health_benefits: z.array(z.string()),
    cultural_authenticity: z.string(),
  })),
  dailyGuidelines: z.object({
    foods_to_emphasize: z.array(z.string()),
    foods_to_limit: z.array(z.string()),
    hydration_tips: z.array(z.string()),
    timing_recommendations: z.array(z.string()),
    cycle_support: z.array(z.string()).optional(),
  }),
  shoppingList: z.record(z.array(z.string())).optional(),
  createdAt: z.string(),
});

export const dailyFeedbackSchema = z.object({
  id: z.number(),
  userId: z.number(),
  mealPlanId: z.number(),
  date: z.string(),
  followedPlan: z.boolean().optional(),
  enjoyedMeals: z.array(z.string()).optional(),
  dislikedMeals: z.array(z.string()).optional(),
  symptomsImprovement: z.record(z.number()).optional(),
  energyLevel: z.number().optional(),
  digestiveHealth: z.number().optional(),
  moodRating: z.number().optional(),
  feedback: z.string().optional(),
  createdAt: z.string(),
});

export const progressTrackingSchema = z.object({
  id: z.number(),
  userId: z.number(),
  date: z.string(),
  symptomsSeverity: z.record(z.number()).optional(),
  menstrualPhase: z.string(),
  overallWellbeing: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const systemMetricsSchema = z.object({
  id: z.number(),
  date: z.string(),
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalMealPlans: z.number(),
  totalChatMessages: z.number(),
  avgUserSatisfaction: z.number().optional(),
  systemHealth: z.record(z.any()).optional(),
  createdAt: z.string(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type OnboardingData = z.infer<typeof onboardingDataSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type DailyMealPlan = z.infer<typeof dailyMealPlanSchema>;
export type DailyFeedback = z.infer<typeof dailyFeedbackSchema>;
export type ProgressTracking = z.infer<typeof progressTrackingSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
