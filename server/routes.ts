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

// Demo response function for testing without external APIs
function generateDemoResponse(message: string, onboardingData: any): ChatResponse {
  const lowerMessage = message.toLowerCase();
  const diet = onboardingData?.diet || 'balanced';
  
  let demoMessage = "";
  let ingredients: IngredientRecommendation[] = [];
  
  if (lowerMessage.includes('energy') || lowerMessage.includes('tired') || lowerMessage.includes('fatigue')) {
    demoMessage = `Based on your ${diet} diet preferences, here are evidence-based natural ingredients that can help boost energy levels and combat fatigue.`;
    ingredients = [
      {
        name: "Maca Root",
        description: "Adaptogenic root that helps balance hormones and naturally increases energy levels",
        emoji: "🌿",
        lazy: "Add 1 tsp maca powder to your morning smoothie",
        tasty: "Blend into chocolate energy balls with dates and nuts",
        healthy: "Mix 1-2 tsp into oatmeal with cinnamon and berries"
      },
      {
        name: "Iron-Rich Spinach",
        description: "High in iron and folate, helps prevent fatigue from iron deficiency",
        emoji: "🥬",
        lazy: "Grab pre-washed baby spinach for quick salads",
        tasty: "Blend into green smoothies with mango and banana",
        healthy: "Sauté with garlic and lemon juice as a side dish"
      },
      {
        name: "Matcha Green Tea",
        description: "Provides sustained energy without jitters, rich in antioxidants",
        emoji: "🍵",
        lazy: "Use instant matcha powder in milk or water",
        tasty: "Make matcha lattes with oat milk and honey",
        healthy: "Whisk ceremonial grade matcha with hot water"
      }
    ];
  } else if (lowerMessage.includes('period') || lowerMessage.includes('menstrual') || lowerMessage.includes('cramp')) {
    demoMessage = `I understand menstrual concerns can be challenging. Here are natural ingredients that research shows may help with menstrual health and comfort.`;
    ingredients = [
      {
        name: "Ginger Root",
        description: "Natural anti-inflammatory that may help reduce menstrual pain intensity",
        emoji: "🫚",
        lazy: "Steep ginger tea bags in hot water for 5 minutes",
        tasty: "Add fresh grated ginger to stir-fries and curries",
        healthy: "Make fresh ginger tea with lemon and honey"
      },
      {
        name: "Magnesium-Rich Dark Chocolate",
        description: "May help reduce cramping and support mood during menstruation",
        emoji: "🍫",
        lazy: "Choose 70%+ dark chocolate squares",
        tasty: "Melt into hot cocoa with cinnamon",
        healthy: "Pair with nuts for sustained blood sugar"
      }
    ];
  } else if (lowerMessage.includes('mood') || lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
    demoMessage = `Mood and stress management are important for overall wellness. Here are natural ingredients that may help support emotional balance.`;
    ingredients = [
      {
        name: "Ashwagandha",
        description: "Adaptogenic herb that may help the body manage stress and support mood",
        emoji: "🌱",
        lazy: "Take as capsules with water",
        tasty: "Mix powder into warm moon milk before bed",
        healthy: "Steep as tea with honey and cardamom"
      },
      {
        name: "Omega-3 Rich Walnuts",
        description: "Support brain health and may help stabilize mood",
        emoji: "🌰",
        lazy: "Snack on a handful of raw walnuts",
        tasty: "Add to yogurt parfaits with berries",
        healthy: "Soak overnight and blend into smoothies"
      }
    ];
  } else {
    demoMessage = `Here are some general wellness ingredients that align with your ${diet} dietary preferences.`;
    ingredients = [
      {
        name: "Chamomile",
        description: "Gentle herb known for its calming and digestive support properties",
        emoji: "🌼",
        lazy: "Brew chamomile tea bags for 5 minutes",
        tasty: "Add honey and lemon to chamomile tea",
        healthy: "Steep loose flowers for stronger therapeutic effect"
      },
      {
        name: "Lemon",
        description: "Rich in vitamin C and may support digestion and immune function",
        emoji: "🍋",
        lazy: "Squeeze into water bottles throughout the day",
        tasty: "Make lemon ginger honey tea",
        healthy: "Start mornings with warm lemon water"
      }
    ];
  }
  
  demoMessage += "\n\nRemember to consult with your healthcare provider before making significant dietary changes.";
  
  return {
    message: demoMessage,
    ingredients
  };
}

// OpenAI ChatGPT integration for personalized health responses
async function generateChatGPTResponse(openai: OpenAI, question: string, onboardingData: any): Promise<ChatResponse> {
  const userContext = onboardingData ? `
User Profile:
- Age: ${onboardingData.age}
- Diet: ${onboardingData.diet}
- Symptoms: ${onboardingData.symptoms?.join(', ') || 'Not specified'}
- Goals: ${onboardingData.goals?.join(', ') || 'General wellness'}
` : '';

  const systemPrompt = `You are a knowledgeable women's health coach. Provide personalized, evidence-based advice about natural ingredients and nutrition for hormonal health.

Respond with exactly this JSON format:
{
  "message": "Your helpful response (include disclaimer about consulting healthcare providers)",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "description": "Health benefits explanation",
      "emoji": "🌿",
      "lazy": "Easy way to use",
      "tasty": "Delicious preparation",
      "healthy": "Optimal method"
    }
  ]
}

Always provide 2-3 ingredient recommendations.${userContext}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No OpenAI response');

    const parsed = JSON.parse(content);
    
    return {
      message: parsed.message,
      ingredients: parsed.ingredients.map((ing: any) => ({
        name: ing.name || 'Unknown',
        description: ing.description || 'Natural ingredient',
        emoji: ing.emoji || '🌿',
        lazy: ing.lazy || 'Use as directed',
        tasty: ing.tasty || 'Add to meals',
        healthy: ing.healthy || 'Follow guidelines'
      }))
    };

  } catch (error) {
    console.error('ChatGPT API error:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 second timeout
  });

  async function requireAuth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      if (token === 'demo-token') {
        req.user = {
          id: 1,
          firebaseUid: 'demo-user-123',
          email: 'demo@example.com',
          name: 'Demo User'
        };
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Register or login user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { firebaseUid, email, name } = insertUserSchema.parse(req.body);
      
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        user = await storage.createUser({ firebaseUid, email, name });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: 'Failed to register user' });
    }
  });

  // Save onboarding data
  app.post('/api/onboarding', requireAuth, async (req: any, res: any) => {
    try {
      const data = insertOnboardingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const onboarding = await storage.saveOnboardingData(data);
      res.json({ success: true, data: onboarding });
    } catch (error) {
      res.status(400).json({ error: 'Failed to save onboarding data' });
    }
  });

  // Chat endpoint
  app.post('/api/chat', requireAuth, async (req: any, res: any) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      // Try ChatGPT with fast timeout, fallback to demo if needed
      let response;
      try {
        response = await Promise.race([
          generateChatGPTResponse(openai, message, onboardingData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        ]) as ChatResponse;
      } catch (error) {
        console.error('ChatGPT API failed, using demo response:', error);
        response = generateDemoResponse(message, onboardingData);
      }

      await storage.saveChatMessage({
        userId: req.user.id,
        message,
        response: response.message,
        ingredients: response.ingredients
      });

      res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
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

  // Initialize research database endpoint
  app.post('/api/research/initialize', requireAuth, async (req: any, res: any) => {
    try {
      await researchService.initializeResearchDatabase();
      res.json({ success: true, message: 'Research database initialized' });
    } catch (error) {
      console.error('Error initializing research database:', error);
      res.status(500).json({ error: 'Failed to initialize research database' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}