import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from 'express';
import { db } from './db';
import { users, onboardingData, chatMessages, dailyMealPlans, dailyFeedback, progressTracking, adminUsers, systemMetrics, insertUserSchema, insertOnboardingSchema, insertChatMessageSchema, type User, type InsertUser, type OnboardingData, type InsertOnboardingData, type ChatMessage, type InsertChatMessage, type DailyMealPlan, type InsertDailyMealPlan, type DailyFeedback, type InsertDailyFeedback, type ProgressTracking, type InsertProgressTracking, type IngredientRecommendation, type ChatResponse } from "./shared-schema";
import { z } from "zod";
import OpenAI from 'openai';
import { researchService } from './research';
import { evaluationMetricsService } from './evaluation-metrics';
import { ENHANCED_TRAINING_PROMPT, validateImplementationMethods } from './llm-training-guide';
import { nutritionistService } from './nutritionist';
import { pdfGeneratorService } from './pdf-generator';
import { auth as firebaseAuth } from './firebase-admin';
import { adaptiveMealPlannerService } from './adaptive-meal-planner';
import { adminAuthService } from './admin-auth';
import { HEALTH_CONDITIONS } from './nutritionist';

interface AuthenticatedRequest extends Request {
  user: User;
}

// Enhanced demo response function with meal plan detection
function generateDemoResponse(message: string, onboardingData: any): ChatResponse {
  const lowerMessage = message.toLowerCase();
  const diet = onboardingData?.diet || 'balanced';
  const age = onboardingData?.age || 'your age group';
  
  // Add timestamp-based randomization to prevent repetitive responses
  const timestamp = Date.now();
  const randomSeed = timestamp % 1000;
  
  // Check if this is a diet/nutrition question vs general health information
  const isDietQuestion = /\b(eat|food|diet|nutrition|meal|recipe|cook|supplement|ingredient|consume|drink|take|add|help with|bloating|digestion)\b/i.test(message);
  
  // Check if user is asking for meal plans
  if (lowerMessage.includes('meal plan') || lowerMessage.includes('what to eat') || 
      lowerMessage.includes('food plan') || lowerMessage.includes('diet plan') ||
      lowerMessage.includes('recipes for') || lowerMessage.includes('meals for')) {
    
    const mealPlanMessages = [
      `I can create a personalized meal plan for you! Based on your ${age} age group and ${diet} preferences, I'll design meals that address your specific health needs. Use the meal plan generator in your dashboard to select your preferred cuisine and get complete meal plans with recipes, shopping lists, and nutritional guidance.`,
      `Perfect! Let me help you with meal planning. Since you prefer a ${diet} diet, I can create customized meal plans that work for your ${age} age group. The meal plan generator offers daily, weekly, or monthly plans with downloadable PDFs - just choose your favorite cuisine style!`,
      `Great question! I'll design meal plans specifically for your ${diet} diet and ${age} age group. The meal plan generator in your dashboard lets you pick from Indian, Mediterranean, Japanese, Mexican, or American cuisines with evidence-based nutritional guidance.`
    ];
    
    return {
      message: mealPlanMessages[randomSeed % mealPlanMessages.length],
      ingredients: [
        {
          name: "Personalized Meal Planning",
          description: "AI-generated meal plans based on your health conditions and cuisine preferences",
          emoji: "🍽️",
          lazy: "Use the meal plan generator with one-click cuisine selection",
          tasty: "Choose from 5 authentic cuisines with flavorful, culturally-relevant recipes",
          healthy: "Get evidence-based meal timing, portion guidance, and therapeutic food combinations"
        }
      ]
    };
  }

  // Handle specific health conditions with varied responses
    if (lowerMessage.includes('pcos') || lowerMessage.includes('polycystic')) {
    const pcosMessages = [
      `## PCOS (Polycystic Ovary Syndrome)

PCOS is a hormonal disorder affecting reproductive-aged women, characterized by irregular periods and elevated androgen levels.

### 🔍 Key Symptoms
• **Menstrual irregularities** - Irregular or missed periods
• **Hormonal signs** - Excess androgen levels causing acne and hirsutism
• **Ovarian changes** - Polycystic ovaries visible on ultrasound
• **Weight challenges** - Weight gain or difficulty losing weight
• **Metabolic issues** - Insulin resistance and blood sugar problems

### 🏥 Health Impacts
• **Diabetes risk** - Increased risk of type 2 diabetes and heart disease
• **Fertility concerns** - Challenges with ovulation and conception
• **Mental health** - Higher rates of anxiety and depression
• **Long-term effects** - Cardiovascular and metabolic complications

### 💊 Management Approaches
• **Medical monitoring** - Regular check-ups with healthcare providers
• **Lifestyle changes** - Exercise, stress management, and weight control
• **Hormonal treatments** - Birth control pills, metformin, or other medications
• **Fertility support** - Specialized treatments when planning pregnancy

*💡 For personalized nutritional support, ask about "foods for PCOS" or "PCOS meal plans"*`,
      `## Understanding PCOS

Polycystic Ovary Syndrome affects many women and can impact various aspects of health.

### 🎯 What is PCOS?
PCOS is a complex hormonal condition that affects how your ovaries work, leading to irregular menstrual cycles and other symptoms.

### 🔍 Common Signs
• Irregular or absent periods
• Excess hair growth (hirsutism)
• Acne and oily skin
• Weight gain, especially around the waist
• Difficulty losing weight
• Dark patches of skin (acanthosis nigricans)

### 🌿 Natural Support Strategies
• **Blood sugar management** - Focus on low-glycemic foods
• **Anti-inflammatory diet** - Include omega-3 rich foods
• **Regular exercise** - Both cardio and strength training
• **Stress reduction** - Meditation, yoga, or other relaxation techniques

*💡 Ask me about "PCOS-friendly foods" or "meal plans for PCOS" for specific nutrition guidance*`
    ];
    
    return {
      message: pcosMessages[randomSeed % pcosMessages.length],
        ingredients: []
      };
    }

    if (lowerMessage.includes('endometriosis')) {
    const endoMessages = [
      `## Endometriosis

Endometriosis is a chronic condition where tissue similar to the uterine lining grows outside the uterus, causing inflammation and pain.

### 🔍 Common Symptoms
• **Severe pelvic pain** - Intense cramping during menstruation
• **Intimate discomfort** - Pain during or after sexual intercourse
• **Heavy bleeding** - Irregular or abnormally heavy menstrual periods
• **Digestive issues** - Bloating, nausea, and bowel problems during periods
• **Chronic fatigue** - Persistent exhaustion and low energy levels

### 💊 Treatment Options
• **Pain management** - NSAIDs, prescription medications, and hormonal therapy
• **Surgical interventions** - Laparoscopy and endometrial tissue excision
• **Hormone therapy** - Treatments to reduce estrogen production
• **Physical therapy** - Specialized pelvic floor rehabilitation

### 🌿 Lifestyle Support
• **Heat therapy** - Heating pads and warm baths for pain relief
• **Gentle exercise** - Low-impact activities like yoga and walking
• **Stress management** - Meditation, breathing exercises, and relaxation techniques
• **Quality sleep** - Consistent sleep schedule and restful environment

*💡 For anti-inflammatory nutrition support, ask about "foods for endometriosis" or "anti-inflammatory meal plans"*`,
      `## Living with Endometriosis

This chronic inflammatory condition affects many women and can significantly impact quality of life.

### 🎯 Understanding the Condition
Endometriosis occurs when tissue similar to the uterine lining grows outside the uterus, causing inflammation, pain, and sometimes fertility issues.

### 🔍 Symptoms to Watch For
• Pelvic pain that worsens during periods
• Pain during intercourse
• Heavy or irregular menstrual bleeding
• Digestive symptoms during menstruation
• Fatigue and mood changes
• Difficulty getting pregnant

### 🌿 Holistic Management
• **Anti-inflammatory diet** - Focus on omega-3s and antioxidants
• **Pain management** - Heat therapy, gentle exercise, and stress reduction
• **Hormone balance** - Work with healthcare providers on treatment options
• **Support systems** - Connect with others who understand the condition

*💡 For specific dietary guidance, ask about "anti-inflammatory foods" or "endometriosis meal plans"*`
    ];
    
    return {
      message: endoMessages[randomSeed % endoMessages.length],
        ingredients: []
      };
    }

    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
    const sleepMessages = [
      `Sleep quality is crucial for hormonal balance and overall women's health.

**Sleep Hygiene Tips:**
- Maintain consistent bedtime and wake times
- Create a dark, cool, quiet sleep environment
- Limit screen time 1-2 hours before bed
- Avoid caffeine after 2 PM

**Hormonal Sleep Factors:**
- Estrogen and progesterone fluctuations affect sleep
- PMS can cause sleep disturbances
- Menopause often brings insomnia and night sweats

**Natural Sleep Support:**
- Regular exercise (but not close to bedtime)
- Relaxation techniques (meditation, deep breathing)
- Consistent evening routine
- Temperature regulation (cool room, breathable bedding)

For specific sleep-supporting foods, ask about foods for better sleep or evening nutrition.`,
      `## Sleep and Women's Health

Quality sleep is essential for hormonal balance, mood regulation, and overall wellness.

### 🌙 Why Sleep Matters for Women
• **Hormone regulation** - Sleep affects estrogen, progesterone, and cortisol levels
• **Mood stability** - Poor sleep can worsen PMS and menopausal symptoms
• **Metabolic health** - Sleep quality impacts insulin sensitivity and weight management
• **Immune function** - Adequate rest supports your body's natural defenses

### 💤 Sleep Optimization Tips
• **Consistent schedule** - Go to bed and wake up at the same time daily
• **Sleep environment** - Keep your bedroom cool, dark, and quiet
• **Digital detox** - Avoid screens 1-2 hours before bedtime
• **Relaxation routine** - Develop calming pre-sleep rituals

### 🍃 Natural Sleep Aids
• **Magnesium-rich foods** - Dark chocolate, nuts, and leafy greens
• **Herbal teas** - Chamomile, valerian root, or passionflower
• **Aromatherapy** - Lavender essential oil for relaxation
• **Gentle movement** - Yoga or stretching before bed

*💡 Ask about "sleep-supporting foods" or "evening nutrition" for specific dietary tips*`
    ];
    
    return {
      message: sleepMessages[randomSeed % sleepMessages.length],
        ingredients: []
      };
    }

  // Handle general health information questions (no food recommendations)
  if (!isDietQuestion) {
    const generalMessages = [
      `I'm here to help with women's health questions! I can provide information about conditions like PCOS, endometriosis, thyroid disorders, and menstrual health, plus create personalized meal plans and nutritional guidance. What specific health topic would you like to learn about?`,
      `Welcome! I'm your women's health assistant. I can help with information about hormonal conditions, menstrual health, nutrition, and wellness. Feel free to ask about specific conditions or request personalized meal plans tailored to your needs.`,
      `Hi there! I specialize in women's health and nutrition. Whether you have questions about hormonal balance, menstrual health, or need personalized dietary guidance, I'm here to help. What would you like to know more about?`
    ];

    return {
      message: generalMessages[randomSeed % generalMessages.length],
      ingredients: []
    };
  }

  // Generate diet-specific recommendations for nutrition questions with variety
  const nutritionMessages = [
    `Based on your ${diet} diet preferences and ${age} age group, here are some nutritional suggestions to support your health goals. For more specific guidance, try asking about foods for your cycle phase (like "luteal phase foods") or request a personalized meal plan.`,
    `Great question! For your ${diet} diet and ${age} age group, I recommend focusing on these key nutrients. You can also ask about phase-specific nutrition or get a customized meal plan through the dashboard.`,
    `Perfect timing! Here are some ${diet}-friendly nutrition tips for your ${age} age group. For more personalized recommendations, ask about cycle-specific foods or use the meal plan generator.`
  ];

  const allIngredients = [
      {
        name: "Leafy Greens",
        description: "Rich in folate, iron, and magnesium for hormone production and energy",
        emoji: "🥬",
        lazy: "Add pre-washed spinach to smoothies or grab ready-to-eat salad mixes",
        tasty: "Sauté with garlic and lemon, or blend into green smoothies with fruits",
        healthy: "Aim for 2-3 cups daily, vary types (spinach, kale, arugula) for different nutrients"
      },
      {
        name: "Omega-3 Rich Fish",
        description: "Essential fatty acids reduce inflammation and support brain health",
        emoji: "🐟",
        lazy: "Choose canned wild salmon or sardines for quick meals",
        tasty: "Grill with herbs, make fish tacos, or add to salads and pasta",
        healthy: "Include 2-3 servings per week, prioritize wild-caught varieties"
      },
      {
        name: "Complex Carbohydrates",
        description: "Stable blood sugar and sustained energy for hormonal balance",
        emoji: "🌾",
        lazy: "Choose quinoa, oats, or sweet potatoes for easy preparation",
        tasty: "Make overnight oats, quinoa bowls, or roasted sweet potato with toppings",
        healthy: "Fill 1/4 of your plate with whole grains, avoid refined carbohydrates"
    },
    {
      name: "Nuts and Seeds",
      description: "Healthy fats, protein, and minerals for hormone support",
      emoji: "🥜",
      lazy: "Keep a mix of almonds, walnuts, and pumpkin seeds for quick snacks",
      tasty: "Make homemade trail mix or add to yogurt and oatmeal",
      healthy: "Aim for 1/4 cup daily, choose raw or dry-roasted varieties"
    },
    {
      name: "Colorful Vegetables",
      description: "Antioxidants and phytonutrients for cellular health and inflammation reduction",
      emoji: "🥕",
      lazy: "Buy pre-cut vegetables or frozen mixed vegetables for convenience",
      tasty: "Roast with olive oil and herbs, or add to stir-fries and soups",
      healthy: "Fill half your plate with colorful vegetables at each meal"
    },
    {
      name: "Fermented Foods",
      description: "Probiotics support gut health, which is linked to hormone regulation",
      emoji: "🥛",
      lazy: "Include yogurt, kefir, or sauerkraut in your daily routine",
      tasty: "Make smoothie bowls with yogurt or add kimchi to rice dishes",
      healthy: "Include 1-2 servings of fermented foods daily for gut health"
      }
  ];

  // Randomly select 3 ingredients for variety
  const shuffledIngredients = [...allIngredients].sort(() => 0.5 - Math.random());
  const selectedIngredients = shuffledIngredients.slice(0, 3);

  return {
    message: nutritionMessages[randomSeed % nutritionMessages.length],
    ingredients: selectedIngredients
  };
}

// Extract foods from research data with improved parsing
function extractFoodsFromResearch(researchMatches: any[], phase: string): IngredientRecommendation[] {
  const foods: IngredientRecommendation[] = [];
  
  const commonFoodPatterns = [
    /\b(sesame|flax|pumpkin|sunflower)\s+seeds?\b/gi,
    /\b(salmon|sardines|mackerel|tuna)\b/gi,
    /\b(spinach|kale|leafy greens|arugula)\b/gi,
    /\b(avocado|nuts|olive oil)\b/gi,
    /\b(quinoa|oats|brown rice)\b/gi,
    /\b(berries|citrus|fruits)\b/gi,
    /\b(broccoli|cauliflower|cruciferous)\b/gi
  ];
  
  const extractedFoods = new Set<string>();
  
  researchMatches.forEach(match => {
    const content = match.metadata?.content || '';
    commonFoodPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((food: string) => extractedFoods.add(food.toLowerCase()));
      }
    });
  });
  
  // Convert extracted foods to ingredient cards (limited implementation)
  Array.from(extractedFoods).slice(0, 3).forEach((food: string) => {
    const benefits = getFoodBenefits(food, phase);
    if (benefits) {
      foods.push(benefits);
    }
  });
  
  return foods.length > 0 ? foods : getDefaultFoodsForPhase(phase);
}

// Get default foods for each phase when research extraction fails
function getDefaultFoodsForPhase(phase: string, message?: string): IngredientRecommendation[] {
  const allFoods: Record<string, IngredientRecommendation[]> = {
    'Luteal Phase': [
      {
        name: "Sesame Seeds",
        description: "Research shows lignans support progesterone production during luteal phase",
        emoji: "🌱",
        lazy: "Take 1 tbsp sesame seeds daily or sesame seed butter on toast",
        tasty: "Sprinkle toasted sesame seeds on salads or make tahini smoothie bowls",
        healthy: "Consume 1-2 tbsp raw sesame seeds daily with vitamin E-rich foods"
      },
      {
        name: "Sunflower Seeds",
        description: "Studies indicate vitamin E and selenium support luteal phase hormones",
        emoji: "🌻",
        lazy: "Snack on 1/4 cup roasted sunflower seeds or sunflower seed butter",
        tasty: "Add sunflower seeds to homemade granola or trail mix",
        healthy: "Eat 1-2 tbsp raw sunflower seeds daily during luteal phase"
      },
      {
        name: "Leafy Greens",
        description: "Research confirms magnesium reduces PMS symptoms and supports mood",
        emoji: "🥬",
        lazy: "Add pre-washed spinach to smoothies or grab bagged salad mixes",
        tasty: "Make green smoothies with spinach, banana, and almond butter",
        healthy: "Consume 2-3 cups dark leafy greens daily for 200mg+ magnesium"
      },
      {
        name: "Dark Chocolate",
        description: "Studies show magnesium and antioxidants help reduce PMS symptoms",
        emoji: "🍫",
        lazy: "Have 1-2 squares of 70%+ dark chocolate daily",
        tasty: "Make hot chocolate with dark cocoa powder and almond milk",
        healthy: "Consume 1-2 oz dark chocolate (70%+) daily for magnesium and antioxidants"
      },
      {
        name: "Pumpkin Seeds",
        description: "Research indicates zinc and magnesium support hormone balance",
        emoji: "🎃",
        lazy: "Snack on 1/4 cup raw pumpkin seeds or add to yogurt",
        tasty: "Toast with sea salt and herbs, or add to energy balls",
        healthy: "Eat 1-2 tbsp raw pumpkin seeds daily for zinc and magnesium"
      }
    ],
    'Follicular Phase': [
      {
        name: "Flax Seeds",
        description: "Research indicates lignans support healthy estrogen metabolism during follicular phase",
        emoji: "🌾",
        lazy: "Take 1 tbsp ground flaxseed daily mixed in water or yogurt",
        tasty: "Add ground flax to smoothies, oatmeal, or homemade muffins",
        healthy: "Consume 1-2 tbsp freshly ground flaxseeds daily for optimal lignan content"
      },
      {
        name: "Pumpkin Seeds",
        description: "Studies show zinc and iron support healthy follicle development and energy",
        emoji: "🎃",
        lazy: "Snack on 1/4 cup raw or roasted pumpkin seeds daily",
        tasty: "Toast pumpkin seeds with sea salt and herbs, or add to trail mix",
        healthy: "Eat 1-2 tbsp raw pumpkin seeds daily for zinc, iron, and magnesium"
      },
      {
        name: "Citrus Fruits",
        description: "Research confirms vitamin C and folate support hormone production and energy",
        emoji: "🍊",
        lazy: "Eat 1-2 fresh oranges or grapefruits daily, or drink fresh citrus juice",
        tasty: "Make citrus salads with orange, grapefruit, and fresh mint",
        healthy: "Consume 2-3 servings of fresh citrus daily for vitamin C and folate"
      },
      {
        name: "Quinoa",
        description: "Studies show complete protein and iron support energy and hormone production",
        emoji: "🌾",
        lazy: "Cook quinoa in bulk and add to salads or bowls throughout the week",
        tasty: "Make quinoa bowls with roasted vegetables and tahini dressing",
        healthy: "Consume 1/2 cup cooked quinoa daily for complete protein and iron"
      },
      {
        name: "Almonds",
        description: "Research indicates vitamin E and healthy fats support estrogen balance",
        emoji: "🥜",
        lazy: "Snack on 1/4 cup raw almonds or add almond butter to smoothies",
        tasty: "Make almond energy balls or add to homemade granola",
        healthy: "Eat 1/4 cup raw almonds daily for vitamin E and healthy fats"
      }
    ],
    'Menstrual Phase': [
      {
        name: "Dark Leafy Greens",
        description: "Research shows iron and folate help replenish nutrients lost during menstruation",
        emoji: "🥬",
        lazy: "Add baby spinach to smoothies or buy pre-washed salad mixes",
        tasty: "Sauté spinach with garlic and lemon, or add to pasta dishes",
        healthy: "Consume 3-4 cups daily with vitamin C for enhanced iron absorption"
      },
      {
        name: "Ginger Root",
        description: "Studies confirm anti-inflammatory properties reduce menstrual cramps and nausea",
        emoji: "🫚",
        lazy: "Take ginger capsules or drink pre-made ginger tea",
        tasty: "Make fresh ginger tea with honey and lemon, or add to smoothies",
        healthy: "Consume 1-2g fresh ginger daily as tea or in cooking for anti-inflammatory effects"
      },
      {
        name: "Iron-Rich Foods",
        description: "Research indicates heme iron (meat) or plant iron (lentils) prevent anemia",
        emoji: "🥩",
        lazy: "Choose lean ground beef or canned lentils for quick meals",
        tasty: "Make beef stir-fry or hearty lentil curry with warming spices",
        healthy: "Include 3-4oz lean red meat or 1 cup cooked lentils daily during menstruation"
      },
      {
        name: "Chamomile Tea",
        description: "Studies show anti-inflammatory and calming properties help with menstrual discomfort",
        emoji: "🌼",
        lazy: "Drink 2-3 cups chamomile tea daily, especially before bed",
        tasty: "Make chamomile tea with honey and lemon, or add to smoothies",
        healthy: "Consume 2-3 cups chamomile tea daily for anti-inflammatory benefits"
      },
      {
        name: "Sweet Potatoes",
        description: "Research indicates beta-carotene and complex carbs support energy and mood",
        emoji: "🍠",
        lazy: "Microwave sweet potatoes or buy pre-cooked for quick meals",
        tasty: "Roast with cinnamon and maple syrup, or make sweet potato fries",
        healthy: "Consume 1 medium sweet potato daily for beta-carotene and complex carbs"
      }
    ],
    'Ovulation Phase': [
      {
        name: "Avocados",
        description: "Research shows healthy fats and folate support egg quality and hormone production",
        emoji: "🥑",
        lazy: "Add half an avocado to toast, salads, or smoothies daily",
        tasty: "Make guacamole, avocado chocolate mousse, or creamy pasta sauces",
        healthy: "Consume 1/2 to 1 whole avocado daily for monounsaturated fats and folate"
      },
      {
        name: "Wild-Caught Salmon",
        description: "Studies indicate omega-3 fatty acids support egg quality and reduce inflammation",
        emoji: "🐟",
        lazy: "Buy pre-cooked salmon or canned wild salmon for quick meals",
        tasty: "Grill salmon with herbs, or make salmon salad with avocado",
        healthy: "Include 3-4oz wild salmon 2-3 times per week for optimal omega-3 intake"
      },
      {
        name: "Brazil Nuts",
        description: "Research confirms selenium is crucial for egg protection and fertility support",
        emoji: "🥜",
        lazy: "Eat 2-3 Brazil nuts daily as a quick snack",
        tasty: "Add chopped Brazil nuts to granola, yogurt, or energy balls",
        healthy: "Consume 2-3 Brazil nuts daily for 200mcg selenium - optimal for fertility support"
      },
      {
        name: "Berries",
        description: "Studies show antioxidants and vitamin C support egg quality and hormone balance",
        emoji: "🫐",
        lazy: "Add frozen berries to smoothies or yogurt for quick nutrition",
        tasty: "Make berry parfaits, smoothie bowls, or fresh berry salads",
        healthy: "Consume 1-2 cups mixed berries daily for antioxidants and vitamin C"
      },
      {
        name: "Eggs",
        description: "Research indicates choline and protein support egg quality and hormone production",
        emoji: "🥚",
        lazy: "Hard-boil eggs in bulk for quick protein or add to salads",
        tasty: "Make vegetable omelets, egg muffins, or poached eggs on toast",
        healthy: "Consume 1-2 whole eggs daily for choline, protein, and essential nutrients"
      }
    ]
  };
  
  const foods = allFoods[phase] || allFoods['Luteal Phase'];
  
  // Use more robust randomization with message content and timestamp
  const timestamp = Date.now();
  const messageHash = message ? message.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  const phaseHash = phase.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const randomSeed = (timestamp + messageHash + phaseHash) % 1000;
  
  // Create a deterministic but varied shuffle based on multiple factors
  const shuffled = [...foods].sort((a, b) => {
    const aHash = a.name.charCodeAt(0) + randomSeed + messageHash;
    const bHash = b.name.charCodeAt(0) + randomSeed + messageHash;
    return (aHash % 100) - (bHash % 100);
  });
  
  console.log('DEBUG: Food randomization:', {
    phase,
    timestamp,
    messageHash,
    phaseHash,
    randomSeed,
    foodCount: foods.length,
    selectedFoods: shuffled.slice(0, 3).map(f => f.name)
  });
  
  return shuffled.slice(0, 3);
}

// Get benefits and preparation methods for specific foods
function getFoodBenefits(foodName: string, phase: string): any {
  const benefitsMap: Record<string, any> = {
    'sesame seeds': {
      name: "Sesame Seeds",
      description: "Rich in lignans and healthy fats for hormone support",
      emoji: "🌱",
      lazy: "Sprinkle on yogurt or take as tahini",
      tasty: "Toast and add to stir-fries or make tahini dressing",
      healthy: "1-2 tbsp daily for optimal lignan intake"
    },
    'flax seeds': {
      name: "Flax Seeds",
      description: "High in omega-3s and lignans for estrogen balance",
      emoji: "🌾", 
      lazy: "Mix ground flax into smoothies",
      tasty: "Add to oatmeal or bake into muffins",
      healthy: "1 tbsp ground daily, store in refrigerator"
    }
  };
  
  return benefitsMap[foodName.toLowerCase()] || null;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// OpenAI ChatGPT integration for personalized health responses
async function generateChatGPTResponse(openai: OpenAI, question: string, onboardingData: any): Promise<ChatResponse> {
  const lowerQuestion = question.toLowerCase();
  
  // Check if this is a nutrition/diet question
  const isDietQuestion = /\b(eat|food|diet|nutrition|meal|recipe|cook|supplement|ingredient|consume|drink|take|add|help with|bloating|digestion|cramps|period|menstrual|pms)\b/i.test(question);
  
  // Check if this is an exercise question
  const isExerciseQuestion = /\b(exercise|workout|training|cardio|strength|yoga|pilates|running|walking|gym|fitness|movement|activity|sport|dance|swimming|cycling|weight|lifting|squat|pushup|plank|stretch|flexibility|endurance|energy|tired|fatigue)\b/i.test(question);
  
  // Simple NLP for custom conditions
  let customCondition = '';
  if (onboardingData?.medicalConditions) {
    for (const cond of onboardingData.medicalConditions) {
      if (cond.toLowerCase().includes('thyroid')) customCondition = 'Hypothyroidism';
      else if (cond.toLowerCase().includes('pcos') || cond.toLowerCase().includes('pcod')) customCondition = 'PCOS';
      else if (cond.toLowerCase().includes('endo')) customCondition = 'Endometriosis';
      // Add more mappings as needed
    }
  }

  // Under 18 logic
  const isUnder18 = onboardingData?.age === 'Below 18' || onboardingData?.age === '<18' || onboardingData?.age === 'under 18';

  // ALWAYS retrieve relevant research first
  let researchContext = '';
  let researchSources: string[] = [];
  
  try {
    console.log('Retrieving research papers for query:', question);
    const researchMatches = await researchService.searchWithSmartScraping(question, 3);
    
    if (researchMatches.length > 0) {
      researchContext = researchMatches.map(match => 
        `Source: ${match.metadata?.source || 'Research Paper'}\nTitle: ${match.metadata?.title || 'Research Article'}\nContent: ${match.metadata?.content || ''}`
      ).join('\n\n---\n\n');
      
      researchSources = researchMatches.map(match => match.metadata?.url || '').filter(Boolean);
      
      console.log(`Found ${researchMatches.length} relevant research papers`);
    } else {
      console.log('No research papers found for query, will use general knowledge');
    }
  } catch (error) {
    console.error('Error retrieving research papers:', error);
}

  let systemPrompt = `You are a highly supportive, empathetic, and intelligent women's health assistant who deeply knows each user's health profile and provides personalized recommendations. You have a warm, understanding, and professional tone, like a compassionate women's health expert who truly cares about their wellbeing.

You always remember and consider the user's complete health profile when providing any recommendations. Every suggestion must be tailored to their specific conditions, symptoms, dietary preferences, and lifestyle.`;

  if (isUnder18) {
    systemPrompt += `\n\nIMPORTANT: The user is under 18. Do NOT provide any medical, supplement, or restrictive diet advice. Only provide general wellness, healthy eating, and lifestyle tips suitable for minors. Always recommend consulting a pediatrician or guardian for any health concerns.`;
  }

  // Exercise-specific persona
  if (isExerciseQuestion) {
    systemPrompt = `You are an experienced women's fitness trainer specializing in hormonal health and cycle-synced workouts. You understand how exercise affects women's hormones, energy levels, and menstrual cycles. You provide personalized, safe, and effective exercise recommendations based on your extensive knowledge of women's fitness and health.

You have deep knowledge of:
- Women's hormonal cycles and how they affect energy and performance
- Safe and effective exercises for different fitness levels
- Exercise modifications for various health conditions
- Cycle-synced workout principles
- General fitness and wellness best practices

You can provide exercise recommendations based on your expertise, even when specific research studies aren't available.`;
    
    if (isUnder18) {
      systemPrompt += `\n\nIMPORTANT: The user is under 18. Focus on age-appropriate activities like walking, swimming, dancing, and gentle yoga. Avoid intense strength training or high-impact exercises. Always recommend consulting a pediatrician or guardian.`;
    }
  }

  systemPrompt += `\n\nRESPONSE FORMAT REQUIREMENTS:
1. Start with an empathetic opening that acknowledges their concern or situation
2. Give clear, actionable advice in 2-3 sentences maximum
3. Include scientific rationale from the research (cite specific studies when possible)
4. Use a warm, supportive tone throughout
5. Be specific about which foods/exercises, why they help, and how to use them
6. If research is inconclusive, state that gently and offer general wellness guidance

EXAMPLE RESPONSES:
- "Sorry you're feeling this way — period cramps can be really tough. Research shows that magnesium-rich foods like spinach, dark chocolate, and almonds can help relax uterine muscles and reduce pain. Try sipping warm ginger tea too — it's been shown to have anti-inflammatory effects similar to ibuprofen in some studies."
- "I understand how frustrating irregular periods can be. Studies suggest that omega-3 fatty acids from fatty fish and flaxseeds may help regulate menstrual cycles by reducing inflammation. Try adding salmon or chia seeds to your meals 2-3 times per week."
- "Bloating before your period is so uncomfortable, I get it! Research indicates that reducing salt and increasing potassium-rich foods like bananas and sweet potatoes can help balance fluid retention. Stay hydrated with herbal teas like peppermint or chamomile."

IMPORTANT: You must ONLY use information from the provided research context. Do NOT add any information that is not directly supported by the research papers provided.`;

  if (customCondition) {
    systemPrompt += `\n\nUser has a custom medical condition: ${customCondition}. Personalize your response accordingly.`;
  }

  // Enhanced user profile context for exercise questions
  if (isExerciseQuestion) {
    systemPrompt += `\n\nEXERCISE CONTEXT - User Profile:
- Age: ${onboardingData?.age || 'Not specified'}
- Exercise Level: ${onboardingData?.exerciseLevel || 'Not specified'}
- Medical Conditions: ${onboardingData?.medicalConditions?.join(', ') || 'None specified'}
- Symptoms: ${onboardingData?.symptoms?.join(', ') || 'None specified'}
- Last Period Date: ${onboardingData?.lastPeriodDate || 'Not specified'}
- Cycle Length: ${onboardingData?.cycleLength || 'Not specified'}
- Stress Level: ${onboardingData?.stressLevel || 'Not specified'}
- Sleep Hours: ${onboardingData?.sleepHours || 'Not specified'}

EXERCISE GUIDELINES:
- If user has PCOS: Recommend low-impact cardio, strength training, and stress-reducing activities
- If user has fatigue: Suggest gentle, energizing activities like walking, yoga, or swimming
- If user is in follicular phase: Recommend higher intensity workouts, strength training, and cardio
- If user is in luteal phase: Suggest moderate intensity, stress-reducing activities like yoga or pilates
- If user is in menstrual phase: Recommend gentle, restorative activities like walking or gentle stretching
- Always consider the user's current exercise level and medical conditions`;
  } else {
    systemPrompt += `\n\nUser Profile:
- Age: ${onboardingData?.age || 'Not specified'}
- Diet: ${onboardingData?.diet || 'Not specified'}
- Symptoms: ${onboardingData?.symptoms?.join(', ') || 'None specified'}
- Medical Conditions: ${onboardingData?.medicalConditions?.join(', ') || 'None specified'}
- Medications: ${onboardingData?.medications?.join(', ') || 'None specified'}
- Allergies: ${onboardingData?.allergies?.join(', ') || 'None specified'}
- Last Period Date: ${onboardingData?.lastPeriodDate || 'Not specified'}
- Cycle Length: ${onboardingData?.cycleLength || 'Not specified'}
- Stress Level: ${onboardingData?.stressLevel || 'Not specified'}
- Sleep Hours: ${onboardingData?.sleepHours || 'Not specified'}
- Exercise Level: ${onboardingData?.exerciseLevel || 'Not specified'}

PERSONALIZATION GUIDELINES:
- If user has PCOS: Focus on blood sugar management, anti-inflammatory foods, and hormone balance
- If user has thyroid issues: Emphasize iodine-rich foods, selenium, and avoiding goitrogens
- If user has endometriosis: Recommend anti-inflammatory diet and pain management strategies
- If user has irregular periods: Suggest cycle-regulating foods and stress management
- If user has fatigue: Focus on energy-boosting foods and iron-rich options
- If user has digestive issues: Recommend gut-friendly foods and proper meal timing
- Always consider the user's dietary restrictions and allergies
- Tailor recommendations to their specific symptoms and health goals`;
  }

  systemPrompt += `\n\nCRITICAL: Your response must be valid JSON with this exact structure:`;

  if (isDietQuestion) {
    systemPrompt += `
{
  "message": "Your empathetic, research-based response (2-3 sentences max with clear actionable advice)",
  "ingredients": [
    {
      "name": "Specific food/supplement name",
      "description": "Brief health benefit with scientific rationale from research",
      "emoji": "🌿",
      "lazy": "Easiest way to consume it (be specific)",
      "tasty": "Most delicious preparation method (be specific)", 
      "healthy": "Optimal daily amount and timing (be specific)"
    }
  ]
}

Focus on evidence-based nutrition for women's hormonal health. Include 1-3 relevant ingredients with specific implementation methods. ONLY recommend ingredients that are mentioned in the research context. Be warm and supportive in your tone.`;
  } else if (isExerciseQuestion) {
    systemPrompt += `
{
  "message": "Your empathetic, exercise-focused response with clear actionable advice in bullet points",
  "ingredients": [
    {
      "name": "Specific exercise/activity name",
      "description": "Brief benefit and why it's good for the user's situation",
      "emoji": "💪",
      "lazy": "Easiest way to do it (be specific)",
      "tasty": "Most enjoyable way to do it (be specific)", 
      "healthy": "Optimal frequency and duration (be specific)"
    }
  ]
}

EXERCISE RESPONSE GUIDELINES:
- Format responses in clear, numbered bullet points (1, 2, 3, etc.)
- Keep each point concise, supportive, and beginner-friendly
- Consider the user's menstrual cycle phase, fitness level, and health conditions
- Include both cardio and strength training options
- Suggest modifications for different energy levels
- Be encouraging and supportive
- Use your expertise as a women's fitness trainer
- Don't rely solely on research context - use your knowledge of women's fitness

EXAMPLE FORMAT:
"Great question! Here are some exercises perfect for your situation:

1. **Walking (20-30 minutes)** - Gentle cardio that boosts energy without overexertion
2. **Yoga flow (15-20 minutes)** - Reduces stress and improves flexibility  
3. **Bodyweight squats (3 sets of 10)** - Builds strength safely
4. **Swimming (if available)** - Low-impact full-body workout
5. **Dancing to your favorite music** - Fun cardio that lifts your mood

FORMATTING REQUIREMENTS:
- Always use numbered bullet points (1, 2, 3, etc.)
- Keep descriptions brief and encouraging
- Focus on beginner-friendly language
- Include specific time/duration recommendations
- Explain the benefit of each exercise simply"`;
  } else {
    systemPrompt += `
{
  "message": "Your empathetic, research-based response (2-3 sentences max with clear actionable advice)",
  "ingredients": []
}

Provide health information based ONLY on the research context. If the research doesn't contain relevant information, say so clearly and offer general wellness guidance. For nutrition advice, suggest the user ask specifically about foods or diet. Be warm and supportive in your tone.`;
  }

  // Add research context to the prompt
  if (researchContext) {
    systemPrompt += `\n\nRESEARCH CONTEXT (Use this information when available):\n${researchContext}\n\nRemember: You can use this research context to enhance your recommendations, but you can also rely on your expertise as a fitness trainer.`;
  } else {
    if (isExerciseQuestion) {
      systemPrompt += `\n\nNo specific research context available, but that's okay! Use your expertise as a women's fitness trainer to provide practical, safe, and effective exercise recommendations based on the user's profile and situation.`;
    } else {
      systemPrompt += `\n\nNo specific research context available. If you cannot provide a helpful response based on your training data, say so clearly and offer general wellness guidance.`;
    }
  }

  const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.4, // Slightly higher for more empathetic, varied responses
      max_tokens: 800, // Shorter for more concise responses
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No OpenAI response');

    const parsed = JSON.parse(content);
    
    // Validate and enhance ingredient recommendations
    const validatedIngredients = parsed.ingredients.map((ing: any) => {
      const validation = validateImplementationMethods(ing);
      
      return {
        name: ing.name || 'Unknown',
        description: ing.description || 'Natural ingredient',
        emoji: ing.emoji || (isExerciseQuestion ? '💪' : '🌿'),
        lazy: ing.lazy || 'Take as supplement with breakfast daily',
        tasty: ing.tasty || 'Mix into smoothies with fruit and honey',
        healthy: ing.healthy || 'Follow evidence-based dosage guidelines'
      };
    });
    
    return {
      message: parsed.message || 'Here are some personalized recommendations for you.',
      ingredients: validatedIngredients
    };
}

// Daily tips array for backend
const DAILY_TIPS = [
  {
    tip: "Magnesium-rich foods like spinach and almonds can help reduce PMS symptoms. Try adding them to your meals today!",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5485207/"
  },
  {
    tip: "Flax seeds are rich in lignans and omega-3s, supporting hormone balance during the menstrual cycle.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3074428/"
  },
  {
    tip: "Ginger has anti-inflammatory properties that can help reduce menstrual cramps and nausea.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6341159/"
  },
  {
    tip: "Vitamin D from sunlight or fortified foods supports hormonal balance and immune health.",
    source: "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/"
  },
  {
    tip: "Fermented foods like yogurt and kimchi support gut health, which is linked to hormone regulation.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6723657/"
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  let openai: OpenAI | null = null;

  const getOpenAI = (): OpenAI => {
    if (!openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required for AI features');
      }
      openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
    }
    return openai;
  };

  const server = createServer(app);

  // Authentication middleware
  async function requireAuth(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      if (token === 'demo-token') {
        // Demo user for testing - ensure user exists in storage
        let demoUser = await storage.getUserByFirebaseUid('demo');
        if (!demoUser) {
          demoUser = await storage.createUser({
            firebaseUid: 'demo',
            email: 'demo@example.com',
            name: 'Demo User'
          });
          
          // Create demo onboarding data
          await storage.saveOnboardingData({
            userId: demoUser.id,
            age: process.env.DEMO_USER_AGE || '28', // Configurable demo age
            diet: process.env.DEMO_USER_DIET || 'balanced', // Configurable demo diet
            symptoms: ['irregular_periods', 'fatigue_and_low_energy'],
            lastPeriodDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            cycleLength: '28', // Default 28-day cycle
            medications: ['None'],
            goals: ['hormone_balance', 'energy_improvement'],
            exerciseLevel: 'moderate',
            stressLevel: 'moderate',
            sleepHours: '7-8 hours'
          });
        }
        req.user = demoUser;
        next();
      } else {
        // Verify Firebase token
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        let user = await storage.getUserByFirebaseUid(decodedToken.uid);
        
        // If user doesn't exist, create them automatically
        if (!user) {
          user = await storage.createUser({
            firebaseUid: decodedToken.uid,
            email: decodedToken.email || '',
            name: decodedToken.name || 'User'
          });
        }
        
        req.user = user;
        next();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Register or login user

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const { firebaseUid, email, name } = parsed as any;
      
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        user = await storage.createUser({ firebaseUid, email, name });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: 'Failed to register user' });
    }
  });

  // Logout user and clear chat history for privacy
  app.post('/api/auth/logout', requireAuth, async (req: any, res: any) => {
    try {
      await storage.clearChatHistory(req.user.id);
      res.json({ success: true, message: 'Logged out successfully and chat history cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  });

  // Get user profile with onboarding data
  app.get('/api/profile', requireAuth, async (req: any, res: any) => {
    try {
      const onboardingData = await storage.getOnboardingData(req.user.id);
      res.json({ 
        user: req.user,
        onboarding: onboardingData 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load profile' });
    }
  });

  // Get chat history
  app.get('/api/chat/history', requireAuth, async (req: any, res: any) => {
    try {
      const chatHistory = await storage.getChatHistory(req.user.id);
      res.json(chatHistory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load chat history' });
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
      
      console.log('DEBUG: Chat request:', {
        userId: req.user.id,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        hasOnboardingData: !!onboardingData,
        userAge: onboardingData?.age,
        userDiet: onboardingData?.diet,
        lastPeriodDate: onboardingData?.lastPeriodDate,
        cycleLength: onboardingData?.cycleLength
      });
      
      let response;
        try {
          response = await Promise.race([
          generateChatGPTResponse(getOpenAI(), message, onboardingData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000))
          ]) as ChatResponse;
        } catch (error) {
          console.error('ChatGPT API failed, using demo response:', error);
          response = generateDemoResponse(message, onboardingData);
        }

      console.log('DEBUG: Chat response generated:', {
        messageLength: response.message.length,
        ingredientsCount: response.ingredients?.length || 0,
        firstIngredient: response.ingredients?.[0]?.name || 'none',
        responsePreview: response.message.substring(0, 100) + '...'
      });

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

  // Research status endpoint
  app.get('/api/research/status', requireAuth, async (req: any, res: any) => {
    try {
      const isEnabled = researchService.isServiceEnabled();
      if (!isEnabled) {
        return res.json({
          success: false,
          hasData: false,
          sampleResultCount: 0,
          message: 'Research service is disabled - check API keys'
        });
      }

      // Check if we have any data in the database
      const sampleQuery = "women's health nutrition";
      const sampleResults = await researchService.searchRelevantResearch(sampleQuery, 1);
      
      res.json({
        success: true,
        hasData: sampleResults.length > 0,
        sampleResultCount: sampleResults.length,
        message: sampleResults.length > 0 
          ? 'Research database is active and contains data'
          : 'Research service is enabled but no data found - needs initialization'
      });
    } catch (error) {
      console.error('Research status error:', error);
      res.json({
        success: false,
        hasData: false,
        sampleResultCount: 0,
        message: 'Error checking research service status'
      });
    }
  });

  // Research initialization endpoint (requires auth)
  app.post('/api/research/initialize', requireAuth, async (req: any, res: any) => {
    try {
      if (!researchService.isServiceEnabled()) {
        return res.status(400).json({
          success: false,
          message: 'Research service is disabled - check API keys'
        });
      }

      await researchService.initializeResearchDatabase();
      res.json({
        success: true,
        message: 'Research database initialization started'
      });
    } catch (error) {
      console.error('Research initialization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize research database'
      });
    }
  });

  // Public research initialization endpoint (no auth required)
  app.post('/api/research/initialize-public', async (req: any, res: any) => {
    try {
      if (!researchService.isServiceEnabled()) {
        return res.status(400).json({
          success: false,
          message: 'Research service is disabled - check API keys'
        });
      }

      // Start the initialization process
      researchService.initializeResearchDatabase().then(() => {
        console.log('Research database initialization completed successfully');
      }).catch((error) => {
        console.error('Research initialization failed:', error);
      });

      res.json({
        success: true,
        message: 'Research database initialization started in background'
      });
    } catch (error) {
      console.error('Research initialization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start research database initialization'
      });
    }
  });

  // Evaluation metrics endpoints
  app.get('/api/evaluation/research-quality', requireAuth, async (req: any, res: any) => {
    try {
      const metrics = await evaluationMetricsService.evaluateResearchQuality();
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Research quality evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate research quality' });
    }
  });

  app.get('/api/evaluation/meal-plan-quality', requireAuth, async (req: any, res: any) => {
    try {
      const metrics = await evaluationMetricsService.evaluateMealPlanQuality(req.user.id);
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Meal plan quality evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate meal plan quality' });
    }
  });

  app.get('/api/evaluation/adaptive-responses', requireAuth, async (req: any, res: any) => {
    try {
      const metrics = await evaluationMetricsService.evaluateAdaptiveResponses(req.user.id);
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Adaptive responses evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate adaptive responses' });
    }
  });

  app.get('/api/evaluation/chatbot-performance', requireAuth, async (req: any, res: any) => {
    try {
      const metrics = await evaluationMetricsService.evaluateChatbotPerformance();
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chatbot performance evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate chatbot performance' });
    }
  });

  app.get('/api/evaluation/rag-metrics', requireAuth, async (req: any, res: any) => {
    try {
      const metrics = await evaluationMetricsService.evaluateRAGPerformance();
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('RAG metrics evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate RAG metrics' });
    }
  });

  app.get('/api/evaluation/comprehensive-report', requireAuth, async (req: any, res: any) => {
    try {
      const report = await evaluationMetricsService.generateEvaluationReport(req.user.id);
      res.json({
        success: true,
        report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Comprehensive evaluation error:', error);
      res.status(500).json({ error: 'Failed to generate comprehensive evaluation report' });
    }
  });

  // Daily meal plan endpoint
  app.post('/api/nutrition/meal-plan', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference = 'mediterranean' } = req.body;

      if (!cuisinePreference) {
        return res.status(400).json({ error: 'Cuisine preference is required' });
      }

      // Get user's onboarding data for health assessment
      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      if (!onboardingData) {
        return res.status(400).json({ error: 'Complete onboarding first to get personalized meal plans' });
      }

      // Extract health conditions from user profile
      const healthConditions = nutritionistService.extractHealthConditions(onboardingData);
      
      // Generate personalized meal plan
      const mealPlan = await nutritionistService.generateMealPlan(
        healthConditions,
        cuisinePreference,
        onboardingData
      );

      // Generate shopping list
      const shoppingList = nutritionistService.generateShoppingList(mealPlan);

      res.json({
        success: true,
        mealPlan,
        shoppingList,
        detectedConditions: healthConditions,
        message: `Generated ${cuisinePreference} meal plan for your health profile`
      });

    } catch (error) {
      console.error('Meal plan generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate meal plan',
        message: 'Please try again with a different cuisine or check your health profile' 
      });
    }
  });

  // Weekly meal plan endpoint
  app.post('/api/nutrition/meal-plan/weekly', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference = 'mediterranean' } = req.body;

      if (!cuisinePreference) {
        return res.status(400).json({ error: 'Cuisine preference is required' });
      }

      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      if (!onboardingData) {
        return res.status(400).json({ error: 'Complete onboarding first to get personalized meal plans' });
      }

      const healthConditions = nutritionistService.extractHealthConditions(onboardingData);
      
      const weeklyPlan = await nutritionistService.generateWeeklyMealPlan(
        healthConditions,
        cuisinePreference,
        onboardingData
      );

      const shoppingList = nutritionistService.generateWeeklyShoppingList(weeklyPlan.days);

      res.json({
        success: true,
        mealPlan: { weeklyPlan },
        shoppingList,
        detectedConditions: healthConditions,
        message: `Generated 7-day ${cuisinePreference} meal plan for your health profile`
      });

    } catch (error) {
      console.error('Weekly meal plan error:', error);
      res.status(500).json({ 
        error: 'Failed to generate weekly meal plan',
        message: 'Please try again with a different cuisine or check your health profile' 
      });
    }
  });

  // Monthly meal plan endpoint
  app.post('/api/nutrition/meal-plan/monthly', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference = 'mediterranean' } = req.body;

      if (!cuisinePreference) {
        return res.status(400).json({ error: 'Cuisine preference is required' });
      }

      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      if (!onboardingData) {
        return res.status(400).json({ error: 'Complete onboarding first to get personalized meal plans' });
      }

      const healthConditions = nutritionistService.extractHealthConditions(onboardingData);
      
      const monthlyPlan = await nutritionistService.generateMonthlyMealPlan(
        healthConditions,
        cuisinePreference,
        onboardingData
      );

      const shoppingList = nutritionistService.generateMonthlyShoppingList(monthlyPlan.weeks);

      res.json({
        success: true,
        mealPlan: { monthlyPlan },
        shoppingList,
        detectedConditions: healthConditions,
        message: `Generated 4-week ${cuisinePreference} meal plan for your health profile`
      });

    } catch (error) {
      console.error('Monthly meal plan error:', error);
      res.status(500).json({ 
        error: 'Failed to generate monthly meal plan',
        message: 'Please try again with a different cuisine or check your health profile' 
      });
    }
  });

  // Generate and download weekly meal plan PDF
  app.post('/api/nutrition/meal-plan/weekly/pdf', requireAuth, async (req: any, res: any) => {
    try {
      const { weeklyPlan, userProfile, cuisineStyle } = req.body;
      
      if (!weeklyPlan || !cuisineStyle) {
        return res.status(400).json({ error: 'Weekly plan and cuisine style are required' });
      }

      // Generate comprehensive text-based meal plan with menstrual cycle information
      const currentPhase = userProfile?.lastPeriodDate ? 
        (userProfile.irregularPeriods ? 'follicular' : 'follicular') : 'follicular';
      
      const phaseData = {
        follicular: {
          name: "Follicular Phase",
          description: "Energy building - Support estrogen with lignans and healthy fats",
          seeds: ["Ground flax seeds (1-2 tbsp daily)", "Raw pumpkin seeds (1-2 oz daily)"]
        }
      };

      const currentPhaseInfo = phaseData[currentPhase as keyof typeof phaseData] || phaseData.follicular;

      const textContent = `WEEKLY MEAL PLAN - ${cuisineStyle.toUpperCase()} CUISINE
=================================================================

MENSTRUAL CYCLE PHASE: ${currentPhaseInfo.name}
${currentPhaseInfo.description}

SEED CYCLING FOR THIS PHASE:
${currentPhaseInfo.seeds.map(seed => `• ${seed}`).join('\n')}

=================================================================
DAILY MEAL PLANS
=================================================================

${weeklyPlan.days.map((day: any) => `
${day.dayName.toUpperCase()} - ${day.date}
-----------------------------------------------------------------

🌅 BREAKFAST: ${day.meals.breakfast.name}
   Ingredients: ${day.meals.breakfast.ingredients.join(', ')}
   Prep time: ${day.meals.breakfast.preparation_time}
   Method: ${day.meals.breakfast.cooking_method}
   Health benefits: ${day.meals.breakfast.health_benefits.join(', ')}

☀️ LUNCH: ${day.meals.lunch.name}
   Ingredients: ${day.meals.lunch.ingredients.join(', ')}
   Prep time: ${day.meals.lunch.preparation_time}
   Method: ${day.meals.lunch.cooking_method}
   Health benefits: ${day.meals.lunch.health_benefits.join(', ')}

🌙 DINNER: ${day.meals.dinner.name}
   Ingredients: ${day.meals.dinner.ingredients.join(', ')}
   Prep time: ${day.meals.dinner.preparation_time}
   Method: ${day.meals.dinner.cooking_method}
   Health benefits: ${day.meals.dinner.health_benefits.join(', ')}

🍎 SNACKS: ${day.meals.snacks.map((snack: any) => snack.name).join(', ')}
   Details: ${day.meals.snacks.map((snack: any) => `${snack.name} (${snack.preparation_time})`).join(', ')}

`).join('\n')}

=================================================================
WEEKLY SHOPPING LIST
=================================================================

${Object.entries(weeklyPlan.weeklyShoppingList).map(([category, items]) => `
${category.toUpperCase().replace(/_/g, ' ')}:
${(items as string[]).map(item => `□ ${item}`).join('\n')}
`).join('\n')}

=================================================================
WEEKLY NOTES & TIPS
=================================================================

${weeklyPlan.weeklyNotes ? weeklyPlan.weeklyNotes.join('\n\n') : 'Focus on incorporating the recommended seeds for your current menstrual cycle phase to support hormonal balance and overall wellness.'}

Generated with love for your health journey! 💖
`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-meal-plan-${cuisineStyle.toLowerCase()}.txt"`);
      res.send(textContent);

    } catch (error) {
      console.error('Error generating weekly meal plan PDF:', error);
      res.status(500).json({ 
        error: 'Failed to generate weekly meal plan PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Generate and download monthly meal plan PDF
  app.post('/api/nutrition/meal-plan/monthly/pdf', requireAuth, async (req: any, res: any) => {
    try {
      const { monthlyPlan, userProfile, cuisineStyle } = req.body;
      
      if (!monthlyPlan || !cuisineStyle) {
        return res.status(400).json({ error: 'Monthly plan and cuisine style are required' });
      }

      const pdfBuffer = await pdfGeneratorService.generateMonthlyMealPlanPDF(
        monthlyPlan,
        userProfile || {},
        cuisineStyle
      );

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-meal-plan-${cuisineStyle.toLowerCase()}.txt"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating monthly meal plan PDF:', error);
      res.status(500).json({ 
        error: 'Failed to generate monthly meal plan PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Daily adaptive meal planning routes
  
  // Daily check-in endpoint
  app.get('/api/daily/check-in', requireAuth, async (req: any, res: any) => {
    try {
      const checkInResponse = await adaptiveMealPlannerService.generateCheckInQuestions(req.user.id);
      res.json(checkInResponse);
    } catch (error) {
      console.error('Error generating daily check-in:', error);
      res.status(500).json({ error: 'Failed to generate daily check-in' });
    }
  });

  // Generate today's meal plan
  app.post('/api/daily/meal-plan', requireAuth, async (req: any, res: any) => {
    try {
      const { previousFeedback } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Generating meal plan for user:', req.user.id, 'date:', today);
      
      const mealPlan = await adaptiveMealPlannerService.generateTodaysMealPlan({
        userId: req.user.id,
        date: today,
        previousFeedback
      });

      console.log('Generated meal plan:', JSON.stringify(mealPlan, null, 2));

      await adaptiveMealPlannerService.saveTodaysMealPlan(req.user.id, mealPlan);

      // Ensure all arrays are properly typed
      const safeMealPlan = {
        ...mealPlan,
        adaptations: Array.isArray(mealPlan.adaptations) ? mealPlan.adaptations : [],
        snacks: Array.isArray(mealPlan.snacks) ? mealPlan.snacks : [],
        dailyGuidelines: {
          ...mealPlan.dailyGuidelines,
          foods_to_emphasize: Array.isArray(mealPlan.dailyGuidelines?.foods_to_emphasize) 
            ? mealPlan.dailyGuidelines.foods_to_emphasize 
            : [],
          foods_to_limit: Array.isArray(mealPlan.dailyGuidelines?.foods_to_limit)
            ? mealPlan.dailyGuidelines.foods_to_limit
            : [],
          hydration_tips: Array.isArray(mealPlan.dailyGuidelines?.hydration_tips)
            ? mealPlan.dailyGuidelines.hydration_tips
            : [],
          timing_recommendations: Array.isArray(mealPlan.dailyGuidelines?.timing_recommendations)
            ? mealPlan.dailyGuidelines.timing_recommendations
            : [],
          cycle_support: Array.isArray(mealPlan.dailyGuidelines?.cycle_support)
            ? mealPlan.dailyGuidelines.cycle_support
            : []
        }
      };

      res.json({
        success: true,
        mealPlan: safeMealPlan,
        message: "Today's personalized meal plan is ready!"
      });
    } catch (error) {
      console.error('Error generating daily meal plan:', error);
      res.status(500).json({ 
        error: 'Failed to generate daily meal plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Submit daily feedback
  app.post('/api/daily/feedback', requireAuth, async (req: any, res: any) => {
    try {
      const feedbackData = {
        ...req.body,
        userId: req.user.id
      };

      await adaptiveMealPlannerService.saveDailyFeedback(req.user.id, feedbackData);

      res.json({
        success: true,
        message: "Thank you for your feedback! I'll use this to personalize tomorrow's meal plan."
      });
    } catch (error) {
      console.error('Error saving daily feedback:', error);
      res.status(500).json({ 
        error: 'Failed to save feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get today's meal plan
  app.get('/api/daily/meal-plan/today', requireAuth, async (req: any, res: any) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const mealPlan = await storage.getDailyMealPlan(req.user.id, today);
      
      if (!mealPlan) {
        return res.json({ 
          success: false, 
          message: "No meal plan found for today. Let's create one!" 
        });
      }

      res.json({
        success: true,
        mealPlan
      });
    } catch (error) {
      console.error('Error fetching today\'s meal plan:', error);
      res.status(500).json({ error: 'Failed to fetch meal plan' });
    }
  });

  // Admin authentication middleware
  async function requireAdminAuth(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No admin token provided' });
      }

      // For demo purposes, accept "admin-token" as a valid admin token
      if (token === 'admin-token') {
        req.admin = { username: 'admin', email: 'admin@winnie.com' };
        return next();
      }

      return res.status(401).json({ error: 'Invalid admin token' });
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(401).json({ error: 'Invalid admin token' });
    }
  }

  // Admin login endpoint
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Demo admin credentials
      if (username === 'admin' && password === 'admin123') {
        res.json({ 
          success: true, 
          token: 'admin-token',
          admin: { username: 'admin', email: 'admin@winnie.com' }
        });
        return;
      }

      // Try to validate against database
      const admin = await adminAuthService.validateAdmin(username, password);
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ 
        success: true, 
        token: 'admin-token', // In production, generate a proper JWT
        admin: { username: admin.username, email: admin.email }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get system metrics for admin dashboard
  app.get('/api/admin/metrics', requireAdminAuth, async (req: any, res: any) => {
    try {
      const metrics = await adminAuthService.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Get metrics history
  app.get('/api/admin/metrics/history', requireAdminAuth, async (req: any, res: any) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const history = await adminAuthService.getMetricsHistory(days);
      res.json(history);
    } catch (error) {
      console.error('Error fetching metrics history:', error);
      res.status(500).json({ error: 'Failed to fetch metrics history' });
    }
  });

  // Get all users for admin dashboard
  app.get('/api/admin/users', requireAdminAuth, async (req: any, res: any) => {
    try {
      const users = await adminAuthService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Save current metrics
  app.post('/api/admin/metrics/save', requireAdminAuth, async (req: any, res: any) => {
    try {
      const metrics = await adminAuthService.saveMetrics();
      res.json({ success: true, metrics });
    } catch (error) {
      console.error('Error saving metrics:', error);
      res.status(500).json({ error: 'Failed to save metrics' });
    }
  });

  // Add endpoint for daily tip
  app.get('/api/daily-tip', (req, res) => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const dailyTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
    res.json(dailyTip);
  });

  // CORS debugging endpoint
  app.get('/api/cors-debug', (req, res) => {
    res.json({
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint to test user-specific chatbot responses
  app.get('/api/debug/user-profile', requireAuth, async (req: any, res: any) => {
    try {
      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      // Test chatbot response with user data
      let testResponse;
      try {
        testResponse = await generateChatGPTResponse(
          getOpenAI(), 
          "I'm feeling tired and bloated today. What should I eat?", 
          onboardingData
        );
      } catch (error) {
        testResponse = generateDemoResponse(
          "I'm feeling tired and bloated today. What should I eat?", 
          onboardingData
        );
      }
      
      res.json({
        success: true,
        user: req.user,
        onboardingData,
        testChatbotResponse: testResponse,
        profileUtilization: {
          hasProfile: !!onboardingData,
          age: onboardingData?.age,
          diet: onboardingData?.diet,
          symptoms: onboardingData?.symptoms,
          medicalConditions: onboardingData?.medicalConditions,
          medications: onboardingData?.medications,
          allergies: onboardingData?.allergies,
          lastPeriodDate: onboardingData?.lastPeriodDate,
          cycleLength: onboardingData?.cycleLength,
          stressLevel: onboardingData?.stressLevel,
          sleepHours: onboardingData?.sleepHours,
          exerciseLevel: onboardingData?.exerciseLevel
        }
      });
    } catch (error) {
      console.error('Debug user profile error:', error);
      res.status(500).json({ error: 'Failed to debug user profile' });
    }
  });

  // Debug endpoint to test meal plan generation with user profile
  app.get('/api/debug/meal-plan-profile', requireAuth, async (req: any, res: any) => {
    try {
      const onboardingData = await storage.getOnboardingData(req.user.id);
      
      if (!onboardingData) {
        return res.status(400).json({ error: 'Complete onboarding first to test meal plan generation' });
      }

      // Extract health conditions from user profile
      const healthConditions = nutritionistService.extractHealthConditions(onboardingData);
      
      // Test with a sample cuisine preference
      const testCuisine = 'mediterranean';
      
      // Generate a test meal plan
      const testMealPlan = await nutritionistService.generateMealPlan(
        healthConditions,
        testCuisine,
        onboardingData
      );
      
      res.json({
        success: true,
        user: req.user,
        onboardingData,
        extractedHealthConditions: healthConditions,
        testMealPlan,
        profileUtilization: {
          hasProfile: !!onboardingData,
          age: onboardingData?.age,
          diet: onboardingData?.diet,
          symptoms: onboardingData?.symptoms,
          medicalConditions: onboardingData?.medicalConditions,
          medications: onboardingData?.medications,
          allergies: onboardingData?.allergies,
          exerciseLevel: onboardingData?.exerciseLevel,
          stressLevel: onboardingData?.stressLevel,
          sleepHours: onboardingData?.sleepHours,
          goals: onboardingData?.goals,
          height: onboardingData?.height,
          weight: onboardingData?.weight,
          lastPeriodDate: onboardingData?.lastPeriodDate,
          cycleLength: onboardingData?.cycleLength
        },
        healthConditionMapping: {
          detectedConditions: healthConditions,
          conditionDetails: healthConditions.map(condition => ({
            condition,
            details: HEALTH_CONDITIONS[condition] || 'Unknown condition'
          }))
        }
      });
    } catch (error) {
      console.error('Debug meal plan profile error:', error);
      res.status(500).json({ error: 'Failed to debug meal plan profile' });
    }
  });

  return server;
}