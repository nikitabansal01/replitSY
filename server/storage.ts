import { users, onboardingData, chatMessages, type User, type InsertUser, type OnboardingData, type InsertOnboardingData, type ChatMessage, type InsertChatMessage, type IngredientRecommendation } from "@shared/schema";

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
}

export const storage = new MemStorage();
