import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOnboardingSchema, insertChatMessageSchema, type IngredientRecommendation, type ChatResponse, type User } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user: User;
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Generate AI response with ingredients (mock RAG system)
      const response = generateHealthResponse(message, onboardingData);

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

// Mock RAG system - generates health responses based on user profile and question
function generateHealthResponse(question: string, onboardingData: any): ChatResponse {
  const questionLower = question.toLowerCase();
  
  // Common ingredient databases based on health concerns
  const ingredientDatabase = {
    cramps: [
      {
        name: "Ginger",
        description: "Anti-inflammatory properties help reduce prostaglandin production",
        emoji: "🫚",
        lazy: "Ginger tea bags",
        tasty: "Ginger lemon honey drink",
        healthy: "Fresh ginger in stir-fry"
      },
      {
        name: "Dark Chocolate",
        description: "Magnesium content helps relax muscles and reduce pain",
        emoji: "🍫",
        lazy: "Dark chocolate squares (70%+)",
        tasty: "Chocolate avocado mousse",
        healthy: "Raw cacao in smoothie"
      },
      {
        name: "Turmeric",
        description: "Curcumin reduces inflammation and pain",
        emoji: "🟡",
        lazy: "Turmeric supplements",
        tasty: "Golden milk latte",
        healthy: "Fresh turmeric in curry"
      }
    ],
    pms: [
      {
        name: "Leafy Greens",
        description: "High in magnesium and B vitamins to support mood",
        emoji: "🥬",
        lazy: "Pre-washed spinach salad",
        tasty: "Green smoothie bowl",
        healthy: "Sautéed kale with garlic"
      },
      {
        name: "Salmon",
        description: "Omega-3 fatty acids reduce inflammation and support mood",
        emoji: "🐟",
        lazy: "Canned salmon on crackers",
        tasty: "Teriyaki salmon bowl",
        healthy: "Grilled salmon with herbs"
      },
      {
        name: "Chamomile",
        description: "Natural calming properties to reduce anxiety and promote sleep",
        emoji: "🌼",
        lazy: "Chamomile tea bags",
        tasty: "Chamomile honey ice cream",
        healthy: "Fresh chamomile tea"
      }
    ],
    bloating: [
      {
        name: "Fennel",
        description: "Natural digestive aid that reduces gas and bloating",
        emoji: "🌿",
        lazy: "Fennel tea bags",
        tasty: "Fennel orange salad",
        healthy: "Roasted fennel with lemon"
      },
      {
        name: "Peppermint",
        description: "Soothes digestive system and reduces intestinal spasms",
        emoji: "🌱",
        lazy: "Peppermint tea",
        tasty: "Chocolate peppermint smoothie",
        healthy: "Fresh mint in water"
      },
      {
        name: "Papaya",
        description: "Digestive enzymes help break down food and reduce bloating",
        emoji: "🥭",
        lazy: "Pre-cut papaya chunks",
        tasty: "Papaya coconut bowl",
        healthy: "Fresh papaya with lime"
      }
    ],
    fatigue: [
      {
        name: "Iron-rich Foods",
        description: "Combat iron deficiency anemia common in women",
        emoji: "🥩",
        lazy: "Iron supplements",
        tasty: "Spinach and berry smoothie",
        healthy: "Lentil and vegetable curry"
      },
      {
        name: "B-Complex Vitamins",
        description: "Support energy metabolism and reduce fatigue",
        emoji: "🥚",
        lazy: "B-complex supplements",
        tasty: "Avocado toast with egg",
        healthy: "Quinoa Buddha bowl"
      }
    ]
  };

  let selectedIngredients: IngredientRecommendation[] = [];
  let responseMessage = "";

  // Determine which ingredients to recommend based on question and profile
  if (questionLower.includes('cramp') || questionLower.includes('pain')) {
    selectedIngredients = ingredientDatabase.cramps.slice(0, 3);
    responseMessage = "Here are some evidence-based ingredients that can help reduce menstrual cramps:";
  } else if (questionLower.includes('pms') || questionLower.includes('mood')) {
    selectedIngredients = ingredientDatabase.pms.slice(0, 3);
    responseMessage = "These ingredients can help manage PMS symptoms and support emotional balance:";
  } else if (questionLower.includes('bloat') || questionLower.includes('digest')) {
    selectedIngredients = ingredientDatabase.bloating.slice(0, 3);
    responseMessage = "For bloating and digestive issues, try these natural remedies:";
  } else if (questionLower.includes('tired') || questionLower.includes('fatigue') || questionLower.includes('energy')) {
    selectedIngredients = ingredientDatabase.fatigue.slice(0, 3);
    responseMessage = "To combat fatigue and boost energy naturally:";
  } else {
    // General health response
    selectedIngredients = [
      ...ingredientDatabase.cramps.slice(0, 1),
      ...ingredientDatabase.pms.slice(0, 1),
      ...ingredientDatabase.bloating.slice(0, 1)
    ];
    responseMessage = "Based on your profile, here are some beneficial ingredients for overall hormonal health:";
  }

  // Personalize based on diet preferences
  if (onboardingData?.diet === 'vegetarian') {
    selectedIngredients = selectedIngredients.filter(ing => 
      !['Salmon'].includes(ing.name)
    );
    // Add vegetarian alternatives if needed
    if (selectedIngredients.length < 3) {
      selectedIngredients.push({
        name: "Flax Seeds",
        description: "Plant-based omega-3s for vegetarians",
        emoji: "🌾",
        lazy: "Ground flaxseed in yogurt",
        tasty: "Flax seed muffins",
        healthy: "Fresh ground flax in smoothie"
      });
    }
  }

  if (onboardingData?.diet === 'vegan') {
    selectedIngredients = selectedIngredients.filter(ing => 
      !['Salmon', 'Dark Chocolate'].includes(ing.name)
    );
    // Add more plant-based options
    selectedIngredients.push({
      name: "Chia Seeds",
      description: "Complete protein and omega-3s for vegans",
      emoji: "⚫",
      lazy: "Chia seed pudding cups",
      tasty: "Chia berry parfait",
      healthy: "Chia seeds in water"
    });
  }

  return {
    message: responseMessage,
    ingredients: selectedIngredients.slice(0, 4) // Limit to 4 ingredients max
  };
}
