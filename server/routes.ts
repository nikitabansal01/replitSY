import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOnboardingSchema, insertChatMessageSchema, type IngredientRecommendation, type ChatResponse, type User } from "@shared/schema";
import { z } from "zod";
import OpenAI from 'openai';
import { researchService } from './research';
import { ENHANCED_TRAINING_PROMPT, validateImplementationMethods } from './llm-training-guide';

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
        lazy: "Take 2 maca capsules (500mg each) with breakfast daily",
        tasty: "Blend 1 tsp maca powder into chocolate-banana smoothies with almond butter",
        healthy: "Mix 1-2 tsp raw maca powder into overnight oats 30 minutes before eating for optimal absorption"
      },
      {
        name: "Iron-Rich Spinach",
        description: "High in iron and folate, helps prevent fatigue from iron deficiency",
        emoji: "🥬",
        lazy: "Buy pre-washed baby spinach bags and add handfuls to any meal",
        tasty: "Blend 2 cups fresh spinach into green smoothies with pineapple and coconut water",
        healthy: "Sauté 3 cups spinach with garlic and lemon juice, eat with vitamin C foods for iron absorption"
      },
      {
        name: "Rhodiola Rosea",
        description: "Adaptogenic herb that reduces stress-related fatigue and improves mental clarity",
        emoji: "🌸",
        lazy: "Take 200mg rhodiola extract capsule on empty stomach each morning",
        tasty: "Add rhodiola tincture drops to herbal teas with honey and ginger",
        healthy: "Take 300-400mg standardized extract (3% rosavins, 1% salidroside) 30 minutes before breakfast"
      }
    ];
  } else if (lowerMessage.includes('period') || lowerMessage.includes('menstrual') || lowerMessage.includes('cramp')) {
    demoMessage = `I understand menstrual concerns can be challenging. Here are natural ingredients that research shows may help with menstrual health and comfort.`;
    ingredients = [
      {
        name: "Ginger Root",
        description: "Natural anti-inflammatory that reduces menstrual pain as effectively as ibuprofen in clinical studies",
        emoji: "🫚",
        lazy: "Take 250mg ginger capsules 3 times daily during menstruation",
        tasty: "Make warming ginger-cinnamon tea with honey and a splash of oat milk",
        healthy: "Consume 1g fresh ginger daily: grate 1 inch piece into hot water, steep 10 minutes, drink 30 minutes before meals"
      },
      {
        name: "Magnesium Glycinate",
        description: "Relaxes uterine muscles and reduces prostaglandin production that causes cramping",
        emoji: "💊",
        lazy: "Take 200mg magnesium glycinate capsule before bed starting 1 week before period",
        tasty: "Mix magnesium powder into warm almond milk with vanilla and a touch of maple syrup",
        healthy: "Take 300-400mg magnesium glycinate with dinner, avoid calcium supplements within 2 hours for optimal absorption"
      },
      {
        name: "Omega-3 Fish Oil",
        description: "Reduces inflammatory prostaglandins and decreases menstrual pain intensity",
        emoji: "🐟",
        lazy: "Take 2 high-quality fish oil capsules (1000mg EPA/DHA total) with breakfast",
        tasty: "Choose lemon-flavored liquid fish oil and mix into morning smoothies",
        healthy: "Take 2-3g combined EPA/DHA daily with fatty meals, store in refrigerator to maintain potency"
      }
    ];
  } else if (lowerMessage.includes('mood') || lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
    demoMessage = `Mood and stress management are important for overall wellness. Here are natural ingredients that may help support emotional balance.`;
    ingredients = [
      {
        name: "Ashwagandha Root",
        description: "Adaptogenic herb clinically shown to reduce cortisol levels by 30% and improve stress resilience",
        emoji: "🌱",
        lazy: "Take 300mg KSM-66 ashwagandha capsule with breakfast daily",
        tasty: "Mix ashwagandha powder into golden milk lattes with turmeric, ginger, and honey",
        healthy: "Take 500-600mg standardized root extract (5% withanolides) on empty stomach, cycle 8 weeks on, 2 weeks off"
      },
      {
        name: "L-Theanine",
        description: "Amino acid that promotes calm focus and reduces anxiety without drowsiness",
        emoji: "🍃",
        lazy: "Take 200mg L-theanine capsule when feeling stressed or anxious",
        tasty: "Drink high-quality green tea (contains 25-50mg L-theanine naturally) with jasmine",
        healthy: "Take 100-200mg L-theanine 30-60 minutes before stressful situations, can combine with caffeine for focused calm"
      },
      {
        name: "Magnesium Taurate",
        description: "Essential mineral that regulates nervous system and supports GABA production for relaxation",
        emoji: "💊",
        lazy: "Take 400mg magnesium taurate capsule before bed for sleep and stress support",
        tasty: "Mix magnesium powder into evening herbal tea with chamomile and lemon balm",
        healthy: "Take 200mg twice daily with meals, taurate form specifically supports heart and nervous system"
      }
    ];
  } else if (lowerMessage.includes('pcos') || lowerMessage.includes('polycystic')) {
    demoMessage = `PCOS requires a comprehensive approach targeting insulin resistance and hormonal balance. Here are evidence-based natural ingredients.`;
    ingredients = [
      {
        name: "Myo-Inositol",
        description: "Improves insulin sensitivity and ovarian function, reduces testosterone by 73% in clinical studies",
        emoji: "💊",
        lazy: "Take 2g myo-inositol powder mixed in morning water or juice",
        tasty: "Mix inositol into berry smoothies with Greek yogurt, vanilla, and stevia",
        healthy: "Take 2g myo-inositol + 50mg D-chiro-inositol (40:1 ratio) twice daily, 30 minutes before meals for optimal insulin response"
      },
      {
        name: "Spearmint Tea",
        description: "Anti-androgenic herb that reduces free testosterone and improves hirsutism in women with PCOS",
        emoji: "🌿",
        lazy: "Steep 2 organic spearmint tea bags daily (morning and evening)",
        tasty: "Make iced spearmint tea with fresh mint leaves, cucumber, and a splash of apple cider vinegar",
        healthy: "Brew 1 tbsp dried spearmint leaves in hot water for 15 minutes, drink twice daily on empty stomach for maximum anti-androgen effect"
      },
      {
        name: "Chromium Picolinate",
        description: "Trace mineral that enhances insulin action and improves glucose metabolism in insulin-resistant PCOS",
        emoji: "⚡",
        lazy: "Take 200mcg chromium picolinate capsule with largest meal of the day",
        tasty: "Choose chromium-enriched nutritional yeast to sprinkle on salads and pasta",
        healthy: "Take 400mcg chromium picolinate with high-carbohydrate meals, combined with vitamin C for enhanced absorption"
      }
    ];
  } else {
    demoMessage = `Here are some general wellness ingredients that align with your ${diet} dietary preferences.`;
    ingredients = [
      {
        name: "Turmeric Root",
        description: "Potent anti-inflammatory compound curcumin supports joint health and may reduce chronic inflammation",
        emoji: "🌿",
        lazy: "Take 500mg turmeric capsules with black pepper extract (piperine) with meals",
        tasty: "Make golden milk lattes with turmeric, ginger, cinnamon, and coconut milk",
        healthy: "Use 1 tsp fresh grated turmeric with a pinch of black pepper and healthy fat for 2000% better absorption"
      },
      {
        name: "Vitamin D3",
        description: "Essential hormone that supports immune function, mood, and bone health - deficient in 80% of women",
        emoji: "☀️",
        lazy: "Take 2000-4000 IU vitamin D3 softgel with breakfast daily",
        tasty: "Choose vitamin D3 gummies or liquid drops in orange flavor",
        healthy: "Take 1000 IU per 25 pounds body weight with magnesium and vitamin K2 for optimal calcium metabolism"
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

  // Get research-backed information using smart scraping
  let researchContext = '';
  try {
    const researchMatches = await researchService.searchWithSmartScraping(question, 3);
    if (researchMatches.length > 0) {
      researchContext = `

Research-based information to consider:
${researchMatches.map(match => `- ${match.metadata?.title}: ${match.metadata?.content?.substring(0, 200)}...`).join('\n')}

Use this scientific information to provide evidence-based recommendations.`;
    }
  } catch (error) {
    console.log('Research service unavailable, proceeding with general knowledge');
  }

  const systemPrompt = `You are a knowledgeable women's health coach. Provide personalized, evidence-based advice about natural ingredients and nutrition for hormonal health.

${ENHANCED_TRAINING_PROMPT}

STRICT IMPLEMENTATION REQUIREMENTS:

LAZY METHOD must include:
- Specific dosage/amount (e.g., "2 capsules", "1 tsp powder")
- Convenience factor (e.g., "with breakfast", "pre-made", "tea bags")
- Zero cooking or complex preparation
- Grab-and-go solutions

TASTY METHOD must include:
- Flavor enhancement (e.g., "chocolate", "honey", "vanilla")
- Culinary enjoyment (e.g., "smoothie", "latte", "energy balls")
- Creative preparation that feels like a treat
- Pleasant taste combinations

HEALTHY METHOD must include:
- Precise dosage with units (mg, mcg, g, IU, ml)
- Absorption optimization (e.g., "with black pepper", "on empty stomach")
- Timing guidance (e.g., "30 minutes before meals", "with dinner")
- Bioavailability enhancement

Respond with exactly this JSON format:
{
  "message": "Your helpful response (include disclaimer about consulting healthcare providers)",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "description": "Health benefits explanation based on research",
      "emoji": "🌿",
      "lazy": "[CONVENIENCE] Specific easy method with dosage",
      "tasty": "[FLAVOR] Enjoyable culinary preparation",
      "healthy": "[OPTIMAL] Evidence-based dosage with absorption guidance"
    }
  ]
}

Always provide 2-3 ingredient recommendations.${userContext}${researchContext}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No OpenAI response');

    const parsed = JSON.parse(content);
    
    // Validate and enhance ingredient recommendations
    const validatedIngredients = parsed.ingredients.map((ing: any) => {
      const validation = validateImplementationMethods(ing);
      
      // Log validation issues for improvement
      if (!validation.isValid) {
        console.log(`Validation issues for ${ing.name}:`, validation.errors);
        console.log(`Suggestions:`, validation.suggestions);
      }
      
      return {
        name: ing.name || 'Unknown',
        description: ing.description || 'Natural ingredient',
        emoji: ing.emoji || '🌿',
        lazy: ing.lazy || 'Take as supplement with breakfast daily',
        tasty: ing.tasty || 'Mix into smoothies with fruit and honey',
        healthy: ing.healthy || 'Follow evidence-based dosage guidelines'
      };
    });
    
    return {
      message: parsed.message,
      ingredients: validatedIngredients
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
      res.json({ success: true, message: 'Research database initialized with comprehensive women\'s health topics' });
    } catch (error) {
      console.error('Error initializing research database:', error);
      res.status(500).json({ error: 'Failed to initialize research database', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Check research database status
  app.get('/api/research/status', requireAuth, async (req: any, res: any) => {
    try {
      const testQuery = 'PCOS nutrition';
      const results = await researchService.searchRelevantResearch(testQuery, 1);
      
      res.json({ 
        success: true, 
        hasData: results.length > 0,
        sampleResultCount: results.length,
        message: results.length > 0 ? 'Research database is populated and working' : 'Research database is empty - initialize first'
      });
    } catch (error) {
      console.error('Error checking research database status:', error);
      res.status(500).json({ error: 'Failed to check research database status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}