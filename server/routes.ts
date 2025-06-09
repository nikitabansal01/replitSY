import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOnboardingSchema, insertChatMessageSchema, type IngredientRecommendation, type ChatResponse, type User } from "@shared/schema";
import { z } from "zod";
import OpenAI from 'openai';
import { researchService } from './research';

interface AuthenticatedRequest extends Request {
  user: User;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Demo mode - bypass Firebase authentication for development
  async function requireAuth(req: any, res: any, next: any) {
    // In demo mode, create a default user for testing
    let user = await storage.getUserByFirebaseUid("demo-user-123");
    if (!user) {
      user = await storage.createUser({
        firebaseUid: "demo-user-123",
        email: "demo@example.com",
        name: "Demo User",
        profilePicture: null,
      });
    }

    req.user = user;
    next();
  }

  // Onboarding endpoint
  app.post('/api/onboarding', requireAuth, async (req: any, res: any) => {
    try {
      const validatedData = insertOnboardingSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const onboardingData = await storage.saveOnboardingData(validatedData);
      res.json({ success: true, data: onboardingData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to save onboarding data' });
    }
  });

  // Chat endpoint
  app.post('/api/chat', requireAuth, async (req: any, res: any) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user's onboarding data for personalization
      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      // Generate AI response with research-backed RAG
      const response = await generateResearchBackedResponse(openai, message, onboardingData);

      // Save chat message
      await storage.saveChatMessage({
        userId: req.user.id,
        message,
        response: response.message,
        ingredients: response.ingredients
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // Get chat history
  app.get('/api/chat/history', requireAuth, async (req: any, res: any) => {
    try {
      const history = await storage.getChatHistory(req.user.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  });

  // Get user profile
  app.get('/api/profile', requireAuth, async (req: any, res: any) => {
    try {
      const onboardingData = await storage.getOnboardingData(req.user.id);
      res.json({
        user: req.user,
        onboarding: onboardingData
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// AI-powered health response using OpenAI GPT-4 with structured output
async function generateHealthResponseWithAI(openai: OpenAI, question: string, onboardingData: any): Promise<ChatResponse> {
  try {
    // Build user profile context
    const userContext = onboardingData ? `
User Profile:
- Age: ${onboardingData.age}
- Diet: ${onboardingData.diet}
- Primary symptoms: ${onboardingData.symptoms?.join(', ') || 'Not specified'}
- Goals: ${onboardingData.goals?.join(', ') || 'General wellness'}
` : 'No profile data available';

    const systemPrompt = `You are Winnie, a friendly and knowledgeable women's health coach specializing in hormonal wellness and nutrition. You provide evidence-based, personalized recommendations using natural ingredients and lifestyle approaches.

IMPORTANT: You must respond with a JSON object in this exact format:
{
  "message": "Your personalized response message here",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "description": "Brief evidence-based explanation of benefits",
      "emoji": "🌿",
      "lazy": "Quick/convenient way to consume",
      "tasty": "Delicious way to incorporate",
      "healthy": "Optimal preparation method"
    }
  ]
}

Guidelines:
- Always provide 2-4 ingredient recommendations
- Base recommendations on peer-reviewed research when possible
- Consider the user's dietary restrictions (vegetarian/vegan/etc.)
- Provide practical, actionable advice
- Include appropriate emojis for each ingredient
- Keep descriptions concise but informative
- Always include the disclaimer about consulting healthcare providers for serious concerns

${userContext}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', responseContent);
      // Fallback response if JSON parsing fails
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or contact support if the issue persists.",
        ingredients: []
      };
    }

    // Validate the response structure
    if (!parsedResponse.message || !Array.isArray(parsedResponse.ingredients)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure each ingredient has required fields
    const validatedIngredients = parsedResponse.ingredients.map((ing: any) => ({
      name: ing.name || 'Unknown',
      description: ing.description || 'No description available',
      emoji: ing.emoji || '🌿',
      lazy: ing.lazy || 'Use as recommended',
      tasty: ing.tasty || 'Enjoy as preferred',
      healthy: ing.healthy || 'Follow preparation guidelines'
    }));

    return {
      message: parsedResponse.message,
      ingredients: validatedIngredients
    };

  } catch (error) {
    console.error('Error generating AI health response:', error);
    
    // Fallback response in case of API failure
    return {
      message: "I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to ask about specific symptoms like bloating, cramps, or fatigue.",
      ingredients: [
        {
          name: "Ginger",
          description: "Natural anti-inflammatory with digestive benefits",
          emoji: "🫚",
          lazy: "Ginger tea bags",
          tasty: "Fresh ginger in smoothies",
          healthy: "Raw ginger with lemon water"
        }
      ]
    };
  }
}
