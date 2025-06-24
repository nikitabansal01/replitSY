import { users, onboardingData, chatMessages, dailyMealPlans, dailyFeedback, progressTracking, type User, type InsertUser, type OnboardingData, type InsertOnboardingData, type ChatMessage, type InsertChatMessage, type DailyMealPlan, type InsertDailyMealPlan, type DailyFeedback, type InsertDailyFeedback, type ProgressTracking, type InsertProgressTracking, type IngredientRecommendation } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private onboardingData: Map<number, OnboardingData>;
  private chatMessages: Map<number, ChatMessage[]>;
  private dailyMealPlans: Map<string, DailyMealPlan>;
  private dailyFeedback: Map<string, DailyFeedback>;
  private progressTracking: Map<string, ProgressTracking>;
  private currentUserId: number;
  private currentOnboardingId: number;
  private currentChatId: number;
  private currentMealPlanId: number;
  private currentFeedbackId: number;
  private currentProgressId: number;

  constructor() {
    this.users = new Map();
    this.onboardingData = new Map();
    this.chatMessages = new Map();
    this.dailyMealPlans = new Map();
    this.dailyFeedback = new Map();
    this.progressTracking = new Map();
    this.currentUserId = 1;
    this.currentOnboardingId = 1;
    this.currentChatId = 1;
    this.currentMealPlanId = 1;
    this.currentFeedbackId = 1;
    this.currentProgressId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      profilePicture: insertUser.profilePicture || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getOnboardingData(userId: number): Promise<OnboardingData | undefined> {
    return this.onboardingData.get(userId);
  }

  async saveOnboardingData(data: InsertOnboardingData): Promise<OnboardingData> {
    const id = this.currentOnboardingId++;
    const onboarding: OnboardingData = {
      ...data,
      id,
      symptoms: data.symptoms as string[],
      goals: data.goals as string[] || null,
      lifestyle: data.lifestyle as Record<string, any> || null,
      completedAt: new Date(),
    };
    this.onboardingData.set(data.userId, onboarding);
    return onboarding;
  }

  async getChatHistory(userId: number): Promise<ChatMessage[]> {
    return this.chatMessages.get(userId) || [];
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const chatMessage: ChatMessage = {
      ...message,
      id,
      ingredients: (message.ingredients as any) || null,
      createdAt: new Date(),
    };
    
    const userMessages = this.chatMessages.get(message.userId) || [];
    userMessages.push(chatMessage);
    this.chatMessages.set(message.userId, userMessages);
    
    return chatMessage;
  }

  async clearChatHistory(userId: number): Promise<void> {
    this.chatMessages.set(userId, []);
  }

  // Daily meal plan methods
  async getDailyMealPlan(userId: number, date: string): Promise<DailyMealPlan | undefined> {
    const key = `${userId}-${date}`;
    return this.dailyMealPlans.get(key);
  }

  async saveDailyMealPlan(plan: InsertDailyMealPlan): Promise<DailyMealPlan> {
    const id = this.currentMealPlanId++;
    const mealPlan: DailyMealPlan = {
      ...plan,
      id,
      createdAt: new Date()
    };
    const key = `${plan.userId}-${plan.date}`;
    this.dailyMealPlans.set(key, mealPlan);
    return mealPlan;
  }

  // Daily feedback methods
  async getDailyFeedback(userId: number, date: string): Promise<DailyFeedback | undefined> {
    const key = `${userId}-${date}`;
    return this.dailyFeedback.get(key);
  }

  async saveDailyFeedback(feedback: InsertDailyFeedback): Promise<DailyFeedback> {
    const id = this.currentFeedbackId++;
    const dailyFeedback: DailyFeedback = {
      ...feedback,
      id,
      createdAt: new Date()
    };
    const key = `${feedback.userId}-${feedback.date}`;
    this.dailyFeedback.set(key, dailyFeedback);
    return dailyFeedback;
  }

  // Progress tracking methods
  async getProgressTracking(userId: number, date: string): Promise<ProgressTracking | undefined> {
    const key = `${userId}-${date}`;
    return this.progressTracking.get(key);
  }

  async saveProgressTracking(progress: InsertProgressTracking): Promise<ProgressTracking> {
    const id = this.currentProgressId++;
    const progressData: ProgressTracking = {
      ...progress,
      id,
      createdAt: new Date()
    };
    const key = `${progress.userId}-${progress.date}`;
    this.progressTracking.set(key, progressData);
    return progressData;
  }

  async getUserProgressHistory(userId: number, days: number): Promise<ProgressTracking[]> {
    const result: ProgressTracking[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${userId}-${dateStr}`;
      const progress = this.progressTracking.get(key);
      if (progress) {
        result.push(progress);
      }
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// Database storage implementation for user privacy and data persistence
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getOnboardingData(userId: number): Promise<OnboardingData | undefined> {
    const [onboarding] = await db.select().from(onboardingData).where(eq(onboardingData.userId, userId));
    return onboarding || undefined;
  }

  async saveOnboardingData(data: InsertOnboardingData): Promise<OnboardingData> {
    // Check if onboarding data already exists for this user
    const existing = await this.getOnboardingData(data.userId);
    
    if (existing) {
      // Update existing record
      const [onboarding] = await db
        .update(onboardingData)
        .set({
          age: data.age,
          height: data.height || '',
          weight: data.weight || '',
          diet: data.diet,
          symptoms: data.symptoms,
          goals: data.goals || [],
          lifestyle: data.lifestyle || {},
          medicalConditions: data.medicalConditions || [],
          medications: data.medications || [],
          allergies: data.allergies || [],
          menstrualCycle: data.menstrualCycle || {},
          stressLevel: data.stressLevel || '',
          sleepHours: data.sleepHours || '',
          exerciseLevel: data.exerciseLevel || '',
          completedAt: new Date()
        })
        .where(eq(onboardingData.userId, data.userId))
        .returning();
      return onboarding;
    } else {
      // Insert new record
      const [onboarding] = await db
        .insert(onboardingData)
        .values({
          ...data,
          completedAt: new Date()
        })
        .returning();
      return onboarding;
    }
  }

  async getChatHistory(userId: number): Promise<ChatMessage[]> {
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
    return messages;
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        message: message.message,
        userId: message.userId,
        response: message.response,
        ingredients: message.ingredients
      })
      .returning();
    return chatMessage;
  }

  async clearChatHistory(userId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }
}

// Using MemStorage for now while database schema is being finalized
export const storage = new MemStorage();
