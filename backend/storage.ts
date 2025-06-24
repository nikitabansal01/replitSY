import { Storage } from '@google-cloud/storage';
import { db } from './db';
import { dailyMealPlans, dailyFeedback, progressTracking, users, onboardingData, chatMessages } from './shared-schema';
import type { MealItem, DailyGuidelines, IngredientRecommendation, User, InsertUser, OnboardingData, InsertOnboardingData, ChatMessage, InsertChatMessage, DailyMealPlan, InsertDailyMealPlan, DailyFeedback, InsertDailyFeedback, ProgressTracking, InsertProgressTracking } from "./shared-schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Onboarding
  getOnboardingData(userId: number): Promise<OnboardingData | undefined>;
  saveOnboardingData(data: InsertOnboardingData): Promise<OnboardingData>;

  // Chat messages
  getChatHistory(userId: number): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: number): Promise<void>;

  // Daily meal plans
  getDailyMealPlan(userId: number, date: string): Promise<DailyMealPlan | undefined>;
  saveDailyMealPlan(plan: InsertDailyMealPlan): Promise<DailyMealPlan>;
  
  // Daily feedback
  getDailyFeedback(userId: number, date: string): Promise<DailyFeedback | undefined>;
  saveDailyFeedback(feedback: InsertDailyFeedback): Promise<DailyFeedback>;
  
  // Progress tracking
  getProgressTracking(userId: number, date: string): Promise<ProgressTracking | undefined>;
  saveProgressTracking(progress: InsertProgressTracking): Promise<ProgressTracking>;
  getUserProgressHistory(userId: number, days: number): Promise<ProgressTracking[]>;
}

// Database storage implementation for user privacy and data persistence
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) {
      throw new Error("Database not available");
    }
    const userData = insertUser as any;
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getOnboardingData(userId: number): Promise<OnboardingData | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [onboarding] = await db.select().from(onboardingData).where(eq(onboardingData.userId, userId));
    return onboarding || undefined;
  }

  async saveOnboardingData(data: InsertOnboardingData): Promise<OnboardingData> {
    if (!db) {
      throw new Error("Database not available");
    }
    // Check if onboarding data already exists for this user
    const dataObj = data as any;
    const existing = await this.getOnboardingData(dataObj.userId);
    
    if (existing) {
      // Update existing record
      const [onboarding] = await db
        .update(onboardingData)
        .set(dataObj)
        .where(eq(onboardingData.userId, dataObj.userId))
        .returning();
      return onboarding;
    } else {
      // Insert new record
      const [onboarding] = await db
        .insert(onboardingData)
        .values(dataObj)
        .returning();
      return onboarding;
    }
  }

  async getChatHistory(userId: number): Promise<ChatMessage[]> {
    if (!db) {
      throw new Error("Database not available");
    }
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
    return messages;
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    if (!db) {
      throw new Error("Database not available");
    }
    const messageObj = message as any;
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(messageObj)
      .returning();
    return chatMessage;
  }

  async clearChatHistory(userId: number): Promise<void> {
    if (!db) {
      throw new Error("Database not available");
    }
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  // Daily meal plan methods
  async getDailyMealPlan(userId: number, date: string): Promise<DailyMealPlan | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [mealPlan] = await db.select().from(dailyMealPlans)
      .where(and(eq(dailyMealPlans.userId, userId), eq(dailyMealPlans.date, date)));
    return mealPlan || undefined;
  }

  async saveDailyMealPlan(plan: InsertDailyMealPlan): Promise<DailyMealPlan> {
    if (!db) {
      throw new Error("Database not available");
    }
    const planObj = plan as any;
    const [mealPlan] = await db
      .insert(dailyMealPlans)
      .values(planObj)
      .returning();
    return mealPlan;
  }

  // Daily feedback methods
  async getDailyFeedback(userId: number, date: string): Promise<DailyFeedback | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [feedback] = await db.select().from(dailyFeedback)
      .where(and(eq(dailyFeedback.userId, userId), eq(dailyFeedback.date, date)));
    return feedback || undefined;
  }

  async saveDailyFeedback(feedback: InsertDailyFeedback): Promise<DailyFeedback> {
    if (!db) {
      throw new Error("Database not available");
    }
    const feedbackObj = feedback as any;
    const [dailyFeedbackResult] = await db
      .insert(dailyFeedback)
      .values(feedbackObj)
      .returning();
    return dailyFeedbackResult;
  }

  // Progress tracking methods
  async getProgressTracking(userId: number, date: string): Promise<ProgressTracking | undefined> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [progress] = await db.select().from(progressTracking)
      .where(and(eq(progressTracking.userId, userId), eq(progressTracking.date, date)));
    return progress || undefined;
  }

  async saveProgressTracking(progress: InsertProgressTracking): Promise<ProgressTracking> {
    if (!db) {
      throw new Error("Database not available");
    }
    const progressObj = progress as any;
    const [progressData] = await db
      .insert(progressTracking)
      .values(progressObj)
      .returning();
    return progressData;
  }

  async getUserProgressHistory(userId: number, days: number): Promise<ProgressTracking[]> {
    if (!db) {
      throw new Error("Database not available");
    }
    const result: ProgressTracking[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const progress = await this.getProgressTracking(userId, dateStr);
      if (progress) {
        result.push(progress);
      }
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// Only export DatabaseStorage for persistent storage
export const storage = new DatabaseStorage();
