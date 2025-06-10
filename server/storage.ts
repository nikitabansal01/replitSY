import { users, onboardingData, chatMessages, type User, type InsertUser, type OnboardingData, type InsertOnboardingData, type ChatMessage, type InsertChatMessage, type IngredientRecommendation } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private onboardingData: Map<number, OnboardingData>;
  private chatMessages: Map<number, ChatMessage[]>;
  private currentUserId: number;
  private currentOnboardingId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.onboardingData = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentOnboardingId = 1;
    this.currentChatId = 1;
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
          diet: data.diet,
          symptoms: data.symptoms,
          goals: data.goals,
          lifestyle: data.lifestyle,
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
