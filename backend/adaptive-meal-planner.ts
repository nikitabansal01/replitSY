import OpenAI from 'openai';
import { storage } from './storage';
import { nutritionistService } from './nutritionist';
import type { MealItem, DailyGuidelines, InsertDailyMealPlan, InsertDailyFeedback, InsertProgressTracking, CheckInResponse } from './shared-schema';

interface AdaptiveMealPlanRequest {
  userId: number;
  date: string; // YYYY-MM-DD
  previousFeedback?: {
    followedPlan: boolean;
    enjoyedMeals: string[];
    dislikedMeals: string[];
    energyLevel: number;
    digestiveHealth: number;
    moodRating: number;
    feedback: string;
  };
}

interface TodaysMealPlan {
  date: string;
  menstrualPhase: string;
  personalizedMessage: string;
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snacks: MealItem[];
  dailyGuidelines: DailyGuidelines;
  shoppingList: Record<string, string[]>;
  adaptations: string[];
}

class AdaptiveMealPlannerService {
  private openai: OpenAI | null = null;

  constructor() {
    // Don't initialize OpenAI client in constructor
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required for AI features');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  // Determine current menstrual phase
  private determineMenstrualPhase(userProfile: any): string {
    const phases = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
    
    if (!userProfile?.lastPeriodDate) {
      // Use lunar cycle for irregular periods or missing data
      const lunarPhase = this.getLunarCyclePhase();
      return lunarPhase;
    }

    const lastPeriod = new Date(userProfile.lastPeriodDate);
    const today = new Date();
    const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const cycleLength = parseInt(userProfile.cycleLength) || 28;
    const currentCycleDay = daysSinceLastPeriod % cycleLength;

    if (currentCycleDay <= 5) return 'menstrual';
    if (currentCycleDay <= 13) return 'follicular';
    if (currentCycleDay <= 16) return 'ovulatory';
    return 'luteal';
  }

  private getLunarCyclePhase(): string {
    const lunarCycle = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'];
    const today = new Date();
    const lunarMonth = 29.53; // days
    const knownNewMoon = new Date('2024-01-11'); // Reference new moon
    const daysSinceNewMoon = Math.floor((today.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24));
    const currentLunarDay = daysSinceNewMoon % lunarMonth;
    
    if (currentLunarDay < 3.7) return 'menstrual'; // New moon
    if (currentLunarDay < 11.0) return 'follicular'; // Waxing phases
    if (currentLunarDay < 18.4) return 'ovulatory'; // Full moon area
    return 'luteal'; // Waning phases
  }

  // Generate daily check-in questions
  async generateCheckInQuestions(userId: number): Promise<CheckInResponse> {
    const userProfile = await storage.getOnboardingData(userId);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdaysFeedback = await storage.getDailyFeedback(userId, yesterdayStr);
    const yesterdaysPlan = await storage.getDailyMealPlan(userId, yesterdayStr);

    if (!yesterdaysPlan) {
      return {
        message: "Good morning! Ready to start your personalized nutrition journey? We'll create today's meal plan based on your current menstrual cycle phase and health goals. Would you like that?",
        followUpQuestions: [
          "How are you feeling today?",
          "Any specific symptoms or cravings?",
          "What's your energy level like this morning?"
        ]
      };
    }

    if (!yesterdaysFeedback) {
      return {
        message: "Good morning! How did yesterday's meal plan work for you? Your feedback helps me personalize today's recommendations.",
        followUpQuestions: [
          "Did you follow the meal plan?",
          "Which meals did you enjoy most?",
          "How was your energy and mood?",
          "Any digestive issues or improvements?"
        ]
      };
    }

    // Generate adaptive recommendations based on previous feedback
    const adaptiveRecommendations = await this.generateAdaptiveRecommendations(yesterdaysFeedback, userProfile);
    
    return {
      message: "Good morning! Based on your feedback from yesterday, I've got some personalized adjustments for today's plan.",
      followUpQuestions: [
        "How are you feeling this morning?",
        "Ready for today's adapted meal plan?"
      ],
      adaptiveRecommendations
    };
  }

  // Generate adaptive recommendations based on feedback
  private async generateAdaptiveRecommendations(feedback: any, userProfile: any): Promise<string[]> {
    const recommendations = [];

    if (feedback.energyLevel < 3) {
      recommendations.push("Adding more iron-rich foods and B-vitamins for energy support");
    }

    if (feedback.digestiveHealth < 3) {
      recommendations.push("Including more fiber and gut-friendly foods for digestive comfort");
    }

    if (feedback.moodRating < 3) {
      recommendations.push("Incorporating mood-supporting omega-3s and magnesium-rich foods");
    }

    if (feedback.dislikedMeals?.length > 0) {
      recommendations.push(`Replacing ${feedback.dislikedMeals.join(' and ')} with alternatives you'll enjoy more`);
    }

    return recommendations;
  }

  // Generate today's personalized meal plan
  async generateTodaysMealPlan(request: AdaptiveMealPlanRequest): Promise<TodaysMealPlan> {
    try {
      const userProfile = await storage.getOnboardingData(request.userId);
      if (!userProfile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }

      const currentPhase = this.determineMenstrualPhase(userProfile);
      
      // Get previous feedback for adaptations
      const adaptations = request.previousFeedback ? 
        await this.generateAdaptiveRecommendations(request.previousFeedback, userProfile) : [];

      // Generate meal plan using OpenAI with adaptive context
      const systemPrompt = this.buildAdaptivePrompt(userProfile, currentPhase, request.previousFeedback, adaptations);
      
      try {
        const completion = await this.getOpenAI().chat.completions.create({
          model: "gpt-4",  // Fixed model name
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          console.error('OpenAI returned empty response');
          throw new Error('Failed to generate meal plan: Empty response from AI');
        }

        let mealPlan;
        try {
          mealPlan = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', content);
          throw new Error('Failed to generate meal plan: Invalid response format');
        }

        // Validate meal plan structure
        if (!mealPlan.breakfast || !mealPlan.lunch || !mealPlan.dinner || !mealPlan.daily_guidelines) {
          console.error('Invalid meal plan structure:', mealPlan);
          throw new Error('Failed to generate meal plan: Invalid structure');
        }
        
        // Generate personalized message
        const personalizedMessage = this.generatePersonalizedMessage(currentPhase, adaptations, userProfile);

        return {
          date: request.date,
          menstrualPhase: currentPhase,
          personalizedMessage,
          breakfast: mealPlan.breakfast,
          lunch: mealPlan.lunch,
          dinner: mealPlan.dinner,
          snacks: mealPlan.snacks || [],
          dailyGuidelines: mealPlan.daily_guidelines,
          shoppingList: this.generateDailyShoppingList(mealPlan),
          adaptations
        };

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        throw new Error('Failed to generate meal plan: AI service error');
      }

    } catch (error) {
      console.error('Error in generateTodaysMealPlan:', error);
      // Only use fallback for OpenAI errors, not for missing profile or other issues
      if (error instanceof Error && error.message.includes('AI service error')) {
        return this.generateFallbackMealPlan(request.date, this.determineMenstrualPhase({}), {});
      }
      throw error; // Re-throw other errors
    }
  }

  private buildAdaptivePrompt(userProfile: any, phase: string, previousFeedback: any, adaptations: string[]): string {
    const phaseGuidance = {
      menstrual: {
        focus: "Iron-rich foods, warming spices, comfort foods, anti-inflammatory ingredients",
        seeds: "Ground flax seeds (1-2 tbsp daily), Raw pumpkin seeds (1-2 oz daily)",
        avoid: "Cold foods, excessive caffeine, refined sugars"
      },
      follicular: {
        focus: "Fresh vegetables, light proteins, energizing foods, liver-supporting ingredients",
        seeds: "Ground flax seeds (1-2 tbsp daily), Raw pumpkin seeds (1-2 oz daily)", 
        avoid: "Heavy, greasy foods, excess dairy"
      },
      ovulatory: {
        focus: "Antioxidant-rich foods, zinc sources, healthy fats, colorful vegetables",
        seeds: "Raw sesame seeds/tahini (1-2 tbsp daily), Raw sunflower seeds (1-2 oz daily)",
        avoid: "Inflammatory foods, excess alcohol"
      },
      luteal: {
        focus: "Magnesium-rich foods, complex carbs, mood-supporting nutrients, B-vitamins",
        seeds: "Raw sesame seeds/tahini (1-2 tbsp daily), Raw sunflower seeds (1-2 oz daily)",
        avoid: "Caffeine excess, high sodium foods"
      }
    };

    const currentPhaseInfo = phaseGuidance[phase as keyof typeof phaseGuidance];
    
    let adaptiveContext = "";
    if (previousFeedback) {
      adaptiveContext = `
PREVIOUS DAY FEEDBACK (adapt based on this):
- Followed plan: ${previousFeedback.followedPlan ? 'Yes' : 'No'}
- Enjoyed meals: ${previousFeedback.enjoyedMeals?.join(', ') || 'None specified'}
- Disliked meals: ${previousFeedback.dislikedMeals?.join(', ') || 'None'}
- Energy level: ${previousFeedback.energyLevel}/5
- Digestive health: ${previousFeedback.digestiveHealth}/5
- Mood: ${previousFeedback.moodRating}/5
- Additional feedback: ${previousFeedback.feedback || 'None'}

ADAPTATIONS TO MAKE: ${adaptations.join(', ')}
`;
    }

    return `You are a women's health nutritionist creating a personalized daily meal plan.

USER PROFILE:
- Age: ${userProfile?.age || 'Not specified'}
- Diet preference: ${userProfile?.diet || 'Standard'}
- Current symptoms: ${userProfile?.symptoms?.join(', ') || 'None'}
- Health goals: ${userProfile?.goals?.join(', ') || 'General wellness'}

MENSTRUAL CYCLE PHASE: ${phase.toUpperCase()}
- Nutritional focus: ${currentPhaseInfo.focus}
- Seed cycling: ${currentPhaseInfo.seeds}
- Foods to limit: ${currentPhaseInfo.avoid}

${adaptiveContext}

Create ONE DAY meal plan in JSON format:
{
  "breakfast": {
    "name": "Meal name",
    "ingredients": ["ingredient1", "ingredient2"],
    "preparation_time": "15 min",
    "cooking_method": "method",
    "nutritional_focus": ["nutrient1", "nutrient2"],
    "health_benefits": ["benefit1", "benefit2"],
    "cultural_authenticity": "style"
  },
  "lunch": { /* same structure */ },
  "dinner": { /* same structure */ },
  "snacks": [{ /* same structure */ }],
  "daily_guidelines": {
    "foods_to_emphasize": ["food1", "food2"],
    "foods_to_limit": ["food1", "food2"],
    "hydration_tips": ["tip1", "tip2"],
    "timing_recommendations": ["timing1", "timing2"],
    "cycle_support": ["support1", "support2"]
  }
}

Focus on practical, accessible meals that address the user's specific needs and previous feedback.`;
  }

  private generatePersonalizedMessage(phase: string, adaptations: string[], userProfile: any): string {
    const phaseMessages = {
      menstrual: "Nourishing your body during menstruation with iron-rich, comforting foods",
      follicular: "Supporting your body's renewal phase with fresh, energizing nutrition", 
      ovulatory: "Optimizing your peak energy phase with antioxidant-rich, vibrant foods",
      luteal: "Balancing your pre-menstrual phase with mood-supporting, satisfying meals"
    };

    let message = phaseMessages[phase as keyof typeof phaseMessages];
    
    if (adaptations.length > 0) {
      message += `. Today's plan includes these personalized adjustments: ${adaptations.join(', ')}.`;
    }

    return message;
  }

  private generateDailyShoppingList(mealPlan: any): Record<string, string[]> {
    const shoppingList: Record<string, string[]> = {
      proteins: [],
      vegetables: [],
      fruits: [],
      grains: [],
      dairy: [],
      pantry: [],
      herbs_spices: []
    };

    const meals = [mealPlan.breakfast, mealPlan.lunch, mealPlan.dinner, ...(mealPlan.snacks || [])];
    
    meals.forEach(meal => {
      meal.ingredients?.forEach((ingredient: string) => {
        const lowerIngredient = ingredient.toLowerCase();
        
        if (lowerIngredient.includes('chicken') || lowerIngredient.includes('fish') || lowerIngredient.includes('eggs') || lowerIngredient.includes('tofu') || lowerIngredient.includes('beans') || lowerIngredient.includes('lentils')) {
          shoppingList.proteins.push(ingredient);
        } else if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('spinach') || lowerIngredient.includes('broccoli') || lowerIngredient.includes('carrot') || lowerIngredient.includes('onion') || lowerIngredient.includes('tomato')) {
          shoppingList.vegetables.push(ingredient);
        } else if (lowerIngredient.includes('berry') || lowerIngredient.includes('apple') || lowerIngredient.includes('banana') || lowerIngredient.includes('citrus') || lowerIngredient.includes('orange')) {
          shoppingList.fruits.push(ingredient);
        } else if (lowerIngredient.includes('rice') || lowerIngredient.includes('quinoa') || lowerIngredient.includes('oats') || lowerIngredient.includes('bread')) {
          shoppingList.grains.push(ingredient);
        } else if (lowerIngredient.includes('milk') || lowerIngredient.includes('yogurt') || lowerIngredient.includes('cheese')) {
          shoppingList.dairy.push(ingredient);
        } else if (lowerIngredient.includes('oil') || lowerIngredient.includes('vinegar') || lowerIngredient.includes('seeds') || lowerIngredient.includes('nuts')) {
          shoppingList.pantry.push(ingredient);
        } else {
          shoppingList.herbs_spices.push(ingredient);
        }
      });
    });

    // Remove duplicates using Array.from
    Object.keys(shoppingList).forEach(category => {
      shoppingList[category] = Array.from(new Set(shoppingList[category]));
    });

    return shoppingList;
  }

  private generateFallbackMealPlan(date: string, phase: string, userProfile: any): TodaysMealPlan {
    const fallbackMeals = {
      menstrual: {
        breakfast: {
          name: "Iron-Rich Spinach Smoothie Bowl",
          ingredients: ["spinach", "banana", "iron-fortified cereal", "almond milk", "pumpkin seeds"],
          preparation_time: "10 min",
          cooking_method: "blending",
          nutritional_focus: ["iron", "vitamin C", "fiber"],
          health_benefits: ["energy support", "iron absorption", "hormone balance"],
          cultural_authenticity: "modern"
        },
        lunch: {
          name: "Lentil and Vegetable Soup",
          ingredients: ["red lentils", "carrots", "celery", "onion", "vegetable broth", "turmeric"],
          preparation_time: "25 min", 
          cooking_method: "simmering",
          nutritional_focus: ["protein", "iron", "anti-inflammatory"],
          health_benefits: ["sustained energy", "digestive support", "warmth"],
          cultural_authenticity: "comfort food"
        },
        dinner: {
          name: "Baked Salmon with Sweet Potato",
          ingredients: ["salmon fillet", "sweet potato", "broccoli", "olive oil", "herbs"],
          preparation_time: "30 min",
          cooking_method: "baking",
          nutritional_focus: ["omega-3", "beta-carotene", "protein"],
          health_benefits: ["anti-inflammatory", "hormone support", "muscle recovery"],
          cultural_authenticity: "healthy comfort"
        }
      }
    };

    const mealSet = fallbackMeals.menstrual; // Default fallback

    return {
      date,
      menstrualPhase: phase,
      personalizedMessage: `Here's your personalized meal plan for your ${phase} phase, designed to support your body's natural rhythms.`,
      breakfast: mealSet.breakfast,
      lunch: mealSet.lunch,
      dinner: mealSet.dinner,
      snacks: [{
        name: "Flax Seed Energy Balls",
        ingredients: ["ground flax seeds", "dates", "almonds", "dark chocolate chips"],
        preparation_time: "15 min",
        cooking_method: "no-cook",
        nutritional_focus: ["omega-3", "fiber", "natural sugars"],
        health_benefits: ["sustained energy", "hormone support", "satisfaction"],
        cultural_authenticity: "healthy snack"
      }],
      dailyGuidelines: {
        foods_to_emphasize: ["Iron-rich leafy greens", "Warming spices", "Anti-inflammatory foods"],
        foods_to_limit: ["Excessive caffeine", "Refined sugars", "Cold foods"],
        hydration_tips: ["Warm herbal teas", "Room temperature water", "Bone broth"],
        timing_recommendations: ["Eat regular meals", "Include protein with each meal", "Light dinner"],
        cycle_support: ["Ground flax and pumpkin seeds daily", "Gentle movement", "Adequate rest"]
      },
      shoppingList: this.generateDailyShoppingList(mealSet),
      adaptations: []
    };
  }

  // Save today's meal plan to storage
  async saveTodaysMealPlan(userId: number, mealPlan: TodaysMealPlan): Promise<void> {
    const planData: InsertDailyMealPlan = {
      userId,
      date: mealPlan.date,
      menstrualPhase: mealPlan.menstrualPhase,
      breakfast: mealPlan.breakfast,
      lunch: mealPlan.lunch,
      dinner: mealPlan.dinner,
      snacks: mealPlan.snacks,
      dailyGuidelines: mealPlan.dailyGuidelines,
      shoppingList: mealPlan.shoppingList
    };

    await storage.saveDailyMealPlan(planData);
  }

  // Save daily feedback
  async saveDailyFeedback(userId: number, feedback: any): Promise<void> {
    const mealPlan = await storage.getDailyMealPlan(userId, feedback.date);
    if (!mealPlan) throw new Error('No meal plan found for this date');

    const feedbackData: InsertDailyFeedback = {
      userId,
      mealPlanId: mealPlan.id,
      date: feedback.date,
      followedPlan: feedback.followedPlan,
      enjoyedMeals: feedback.enjoyedMeals,
      dislikedMeals: feedback.dislikedMeals,
      symptomsImprovement: feedback.symptomsImprovement,
      energyLevel: feedback.energyLevel,
      digestiveHealth: feedback.digestiveHealth,
      moodRating: feedback.moodRating,
      feedback: feedback.feedback
    };

    await storage.saveDailyFeedback(feedbackData);
  }
}

// Lazy singleton pattern
let _adaptiveMealPlannerService: AdaptiveMealPlannerService | null = null;

export function getAdaptiveMealPlannerService(): AdaptiveMealPlannerService {
  if (!_adaptiveMealPlannerService) {
    _adaptiveMealPlannerService = new AdaptiveMealPlannerService();
  }
  return _adaptiveMealPlannerService;
}

// For backward compatibility
export const adaptiveMealPlannerService = getAdaptiveMealPlannerService();