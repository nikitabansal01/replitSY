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

// Research-backed RAG response using Firecrawl + Pinecone + OpenAI
async function generateResearchBackedResponse(openai: OpenAI, question: string, onboardingData: any): Promise<ChatResponse> {
  try {
    // Search for relevant research articles in vector database
    const relevantResearch = await researchService.searchRelevantResearch(question, 3);
    
    // Build research context from retrieved articles
    const researchContext = relevantResearch.length > 0 
      ? relevantResearch.map((match: any) => 
          `Research: ${match.metadata?.title}\nContent: ${match.metadata?.content}\nSource: ${match.metadata?.source}\n`
        ).join('\n')
      : 'No specific research articles found. Use general evidence-based knowledge.';

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
      "description": "Brief evidence-based explanation of benefits based on research",
      "emoji": "🌿",
      "lazy": "Quick/convenient way to consume",
      "tasty": "Delicious way to incorporate",
      "healthy": "Optimal preparation method"
    }
  ]
}

Guidelines:
- Always provide 2-4 ingredient recommendations
- Base recommendations on the research context provided below when available
- Consider the user's dietary restrictions (vegetarian/vegan/etc.)
- Provide practical, actionable advice
- Include appropriate emojis for each ingredient
- Keep descriptions concise but informative
- Reference research findings when available
- Always include disclaimer about consulting healthcare providers

Research Context:
${researchContext}

${userContext}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1200,
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
    console.error('Error generating research-backed response:', error);
    
    // Fallback to basic AI response if research retrieval fails
    return await generateHealthResponseWithAI(openai, question, onboardingData);
  }
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
- Consider the user's dietary restrictions (vegetarian/vegan/etc.)
- Provide practical, actionable advice
- Include appropriate emojis for each ingredient
- Keep descriptions concise but informative
- Always include disclaimer about consulting healthcare providers

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
    console.error('Error generating health response:', error);
    
    // Return a safe fallback response
    return {
      message: "I'm here to help with your health questions! Please try asking about specific symptoms or health concerns you'd like natural ingredient recommendations for.",
      ingredients: [
        {
          name: "Ginger",
          description: "Natural anti-inflammatory properties that may help with digestive issues",
          emoji: "🫚",
          lazy: "Add ginger tea bags to hot water",
          tasty: "Fresh ginger in smoothies or stir-fries",
          healthy: "Steep fresh ginger root in hot water for 10 minutes"
        }
      ]
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async function requireAuth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // For demo purposes, accept "demo-token" or validate Firebase token
      if (token === 'demo-token') {
        req.user = {
          id: 1,
          firebaseUid: 'demo-user-123',
          email: 'demo@example.com',
          name: 'Demo User'
        };
      } else {
        // In production, validate Firebase token here
        // For now, treat any other token as invalid
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