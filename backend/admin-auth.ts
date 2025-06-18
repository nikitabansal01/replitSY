import bcrypt from 'bcrypt';
import { db } from './db';
import { adminUsers, systemMetrics, users, chatMessages, dailyMealPlans, onboardingData } from '@shared/schema';
import { eq, count, gte, sql } from 'drizzle-orm';

export class AdminAuthService {
  async createAdminUser(username: string, password: string, email: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [admin] = await db.insert(adminUsers).values({
      username,
      passwordHash,
      email
    }).returning();
    
    return admin;
  }

  async validateAdmin(username: string, password: string) {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));

    if (!admin) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    return isValid ? admin : null;
  }

  async getSystemMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0].count;

    // Get active users (users who have created content in the last 7 days)
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(chatMessages, eq(users.id, chatMessages.userId))
      .where(gte(chatMessages.createdAt, sql`NOW() - INTERVAL '7 days'`));
    const activeUsers = activeUsersResult[0].count;

    // Get total meal plans
    const totalMealPlansResult = await db.select({ count: count() }).from(dailyMealPlans);
    const totalMealPlans = totalMealPlansResult[0].count;

    // Get total chat messages
    const totalChatMessagesResult = await db.select({ count: count() }).from(chatMessages);
    const totalChatMessages = totalChatMessagesResult[0].count;

    // Get user distribution by symptoms
    const userSymptoms = await db
      .select({
        symptoms: onboardingData.symptoms,
        count: count()
      })
      .from(onboardingData)
      .groupBy(onboardingData.symptoms);

    // Calculate system health metrics
    const systemHealth = {
      databaseStatus: 'healthy',
      responseTime: Math.random() * 100 + 50, // Simulated response time
      uptime: '99.9%',
      memoryUsage: Math.random() * 30 + 60, // Simulated memory usage percentage
      cpuUsage: Math.random() * 20 + 10, // Simulated CPU usage percentage
    };

    return {
      totalUsers,
      activeUsers,
      totalMealPlans,
      totalChatMessages,
      avgUserSatisfaction: 85, // This would come from feedback data
      systemHealth,
      userSymptoms,
      date: today
    };
  }

  async saveMetrics() {
    const metrics = await this.getSystemMetrics();
    const today = new Date().toISOString().split('T')[0];

    // Check if metrics for today already exist
    const existing = await db
      .select()
      .from(systemMetrics)
      .where(eq(systemMetrics.date, today));

    if (existing.length > 0) {
      // Update existing metrics
      await db
        .update(systemMetrics)
        .set(metrics as any)
        .where(eq(systemMetrics.date, today));
    } else {
      // Insert new metrics
      await db.insert(systemMetrics).values(metrics as any);
    }

    return metrics;
  }

  async getMetricsHistory(days: number = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return await db
      .select()
      .from(systemMetrics)
      .where(gte(systemMetrics.date, cutoffDate))
      .orderBy(systemMetrics.date);
  }

  async getAllUsers() {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        hasOnboarding: sql<boolean>`CASE WHEN ${onboardingData.id} IS NOT NULL THEN true ELSE false END`,
        lastActivity: sql<string>`COALESCE(MAX(${chatMessages.createdAt}), ${users.createdAt})`
      })
      .from(users)
      .leftJoin(onboardingData, eq(users.id, onboardingData.userId))
      .leftJoin(chatMessages, eq(users.id, chatMessages.userId))
      .groupBy(users.id, users.email, users.name, users.createdAt, onboardingData.id)
      .orderBy(sql`MAX(${chatMessages.createdAt}) DESC NULLS LAST`);
  }
}

export const adminAuthService = new AdminAuthService();