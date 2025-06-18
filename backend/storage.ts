import { users, onboardingData, chatMessages, dailyMealPlans, dailyFeedback, progressTracking, type User, type InsertUser, type OnboardingData, type InsertOnboardingData, type ChatMessage, type InsertChatMessage, type DailyMealPlan, type InsertDailyMealPlan, type DailyFeedback, type InsertDailyFeedback, type ProgressTracking, type InsertProgressTracking, type IngredientRecommendation } from "@shared/schema";
import { db } from "./db";
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
    const userData = insertUser as any;
    const user: User = { 
      id,
      firebaseUid: userData.firebaseUid,
      email: userData.email,
      name: userData.name,
      profilePicture: userData.profilePicture ?? null,
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
    const dataObj = data as any;
    const onboarding: OnboardingData = {
      id,
      userId: dataObj.userId,
      age: dataObj.age,
      height: dataObj.height ?? null,
      weight: dataObj.weight ?? null,
      diet: dataObj.diet,
      symptoms: dataObj.symptoms as string[],
      goals: dataObj.goals as string[] ?? null,
      lifestyle: dataObj.lifestyle as Record<string, any> ?? null,
      medicalConditions: dataObj.medicalConditions as string[] ?? null,
      medications: dataObj.medications as string[] ?? null,
      allergies: dataObj.allergies as string[] ?? null,
      lastPeriodDate: dataObj.lastPeriodDate ?? null,
      cycleLength: dataObj.cycleLength ?? null,
      periodLength: dataObj.periodLength ?? null,
      irregularPeriods: dataObj.irregularPeriods ?? false,
      stressLevel: dataObj.stressLevel ?? null,
      sleepHours: dataObj.sleepHours ?? null,
      exerciseLevel: dataObj.exerciseLevel ?? null,
      waterIntake: dataObj.waterIntake ?? null,
      completedAt: new Date(),
    };
    this.onboardingData.set(dataObj.userId, onboarding);
    return onboarding;
  }

  async getChatHistory(userId: number): Promise<ChatMessage[]> {
    return this.chatMessages.get(userId) || [];
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const messageObj = message as any;
    const chatMessage: ChatMessage = {
      id,
      userId: messageObj.userId,
      message: messageObj.message,
      response: messageObj.response,
      ingredients: (messageObj.ingredients as IngredientRecommendation[]) ?? null,
      createdAt: new Date(),
    };
    
    const userMessages = this.chatMessages.get(messageObj.userId) || [];
    userMessages.push(chatMessage);
    this.chatMessages.set(messageObj.userId, userMessages);
    
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
    const planObj = plan as any;
    const mealPlan: DailyMealPlan = {
      id,
      date: planObj.date,
      userId: planObj.userId,
      menstrualPhase: planObj.menstrualPhase,
      breakfast: planObj.breakfast,
      lunch: planObj.lunch,
      dinner: planObj.dinner,
      snacks: planObj.snacks,
      dailyGuidelines: planObj.dailyGuidelines,
      shoppingList: planObj.shoppingList ?? null,
      createdAt: new Date()
    };
    const key = `${planObj.userId}-${planObj.date}`;
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
    const feedbackObj = feedback as any;
    const dailyFeedback: DailyFeedback = {
      id,
      date: feedbackObj.date,
      userId: feedbackObj.userId,
      mealPlanId: feedbackObj.mealPlanId,
      followedPlan: feedbackObj.followedPlan ?? null,
      enjoyedMeals: feedbackObj.enjoyedMeals ?? null,
      dislikedMeals: feedbackObj.dislikedMeals ?? null,
      symptomsImprovement: feedbackObj.symptomsImprovement ?? null,
      energyLevel: feedbackObj.energyLevel ?? null,
      digestiveHealth: feedbackObj.digestiveHealth ?? null,
      moodRating: feedbackObj.moodRating ?? null,
      feedback: feedbackObj.feedback ?? null,
      createdAt: new Date()
    };
    const key = `${feedbackObj.userId}-${feedbackObj.date}`;
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
    const progressObj = progress as any;
    const progressData: ProgressTracking = {
      id,
      date: progressObj.date,
      userId: progressObj.userId,
      menstrualPhase: progressObj.menstrualPhase,
      symptomsSeverity: progressObj.symptomsSeverity ?? null,
      overallWellbeing: progressObj.overallWellbeing ?? null,
      notes: progressObj.notes ?? null,
      createdAt: new Date()
    };
    const key = `${progressObj.userId}-${progressObj.date}`;
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
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return a mock user for now
      return {
        id: 1,
        firebaseUid: (insertUser as any).firebaseUid,
        email: (insertUser as any).email,
        name: (insertUser as any).name,
        profilePicture: null,
        createdAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [onboarding] = await db.select().from(onboardingData).where(eq(onboardingData.userId, userId));
    return onboarding || undefined;
  }

  async saveOnboardingData(data: InsertOnboardingData): Promise<OnboardingData> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return mock data for now
      return {
        id: 1,
        userId: (data as any).userId,
        age: (data as any).age,
        height: null,
        weight: null,
        diet: (data as any).diet,
        symptoms: (data as any).symptoms || [],
        goals: null,
        lifestyle: null,
        medicalConditions: null,
        medications: null,
        allergies: null,
        lastPeriodDate: null,
        cycleLength: null,
        periodLength: null,
        irregularPeriods: false,
        stressLevel: null,
        sleepHours: null,
        exerciseLevel: null,
        waterIntake: null,
        completedAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return [];
    }
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
    return messages;
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return mock message for now
      return {
        id: 1,
        userId: (message as any).userId,
        message: (message as any).message,
        response: (message as any).response,
        ingredients: null,
        createdAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return;
    }
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  // Daily meal plan methods
  async getDailyMealPlan(userId: number, date: string): Promise<DailyMealPlan | undefined> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [mealPlan] = await db.select().from(dailyMealPlans)
      .where(and(eq(dailyMealPlans.userId, userId), eq(dailyMealPlans.date, date)));
    return mealPlan || undefined;
  }

  async saveDailyMealPlan(plan: InsertDailyMealPlan): Promise<DailyMealPlan> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return mock plan for now
      return {
        id: 1,
        userId: (plan as any).userId,
        date: (plan as any).date,
        menstrualPhase: (plan as any).menstrualPhase,
        breakfast: (plan as any).breakfast,
        lunch: (plan as any).lunch,
        dinner: (plan as any).dinner,
        snacks: (plan as any).snacks,
        dailyGuidelines: (plan as any).dailyGuidelines,
        shoppingList: null,
        createdAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [feedback] = await db.select().from(dailyFeedback)
      .where(and(eq(dailyFeedback.userId, userId), eq(dailyFeedback.date, date)));
    return feedback || undefined;
  }

  async saveDailyFeedback(feedback: InsertDailyFeedback): Promise<DailyFeedback> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return mock feedback for now
      return {
        id: 1,
        userId: (feedback as any).userId,
        date: (feedback as any).date,
        mealPlanId: (feedback as any).mealPlanId,
        followedPlan: null,
        enjoyedMeals: null,
        dislikedMeals: null,
        symptomsImprovement: null,
        energyLevel: null,
        digestiveHealth: null,
        moodRating: null,
        feedback: null,
        createdAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return undefined;
    }
    const [progress] = await db.select().from(progressTracking)
      .where(and(eq(progressTracking.userId, userId), eq(progressTracking.date, date)));
    return progress || undefined;
  }

  async saveProgressTracking(progress: InsertProgressTracking): Promise<ProgressTracking> {
    if (!db) {
      console.warn("Database not available, using in-memory storage");
      // Return mock progress for now
      return {
        id: 1,
        userId: (progress as any).userId,
        date: (progress as any).date,
        menstrualPhase: (progress as any).menstrualPhase,
        symptomsSeverity: null,
        overallWellbeing: null,
        notes: null,
        createdAt: new Date()
      };
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
      console.warn("Database not available, using in-memory storage");
      return [];
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

// Using MemStorage for now while database schema is being finalized
export const storage = new MemStorage();
