import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOnboardingSchema, insertChatMessageSchema, type IngredientRecommendation, type ChatResponse, type User } from "@shared/schema";
import { z } from "zod";
import OpenAI from 'openai';
import { researchService } from './research';
import { ENHANCED_TRAINING_PROMPT, validateImplementationMethods } from './llm-training-guide';
import { nutritionistService, type DailyMealPlan } from './nutritionist';
import { pdfGeneratorService } from './pdf-generator';
import { auth as firebaseAuth } from './firebase-admin';

interface AuthenticatedRequest extends Request {
  user: User;
}

// Enhanced demo response function with meal plan detection
function generateDemoResponse(message: string, onboardingData: any): ChatResponse {
  const lowerMessage = message.toLowerCase();
  const diet = onboardingData?.diet || 'balanced';
  
  // Check if this is a diet/nutrition question vs general health information
  const isDietQuestion = /\b(eat|food|diet|nutrition|meal|recipe|cook|supplement|ingredient|consume|drink|take|add|help with|bloating|digestion)\b/i.test(message);
  
  // Check if user is asking for meal plans
  if (lowerMessage.includes('meal plan') || lowerMessage.includes('what to eat') || 
      lowerMessage.includes('food plan') || lowerMessage.includes('diet plan') ||
      lowerMessage.includes('recipes for') || lowerMessage.includes('meals for')) {
    
    return {
      message: `I can create a personalized meal plan for you! Based on your profile, I'll design meals that address your specific health needs. Use the meal plan generator in your dashboard to select your preferred cuisine (Indian, Mediterranean, Japanese, Mexican, or American) and choose from daily, weekly, or monthly plans with downloadable PDFs. I'll create complete meal plans with recipes, shopping lists, and nutritional guidance tailored to your conditions.`,
      ingredients: [
        {
          name: "Personalized Meal Planning",
          description: "AI-generated meal plans based on your health conditions and cuisine preferences",
          emoji: "🍽️",
          lazy: "Use the meal plan generator with one-click cuisine selection",
          tasty: "Choose from 4 authentic cuisines with flavorful, culturally-relevant recipes",
          healthy: "Get evidence-based meal timing, portion guidance, and therapeutic food combinations"
        }
      ]
    };
  }

  // Handle general health information questions (no diet recommendations)
  if (!isDietQuestion) {
    if (lowerMessage.includes('pcos') || lowerMessage.includes('polycystic')) {
      return {
        message: `PCOS (Polycystic Ovary Syndrome) is a hormonal disorder affecting reproductive-aged women.

**Types of PCOS:**
- **Classic PCOS**: High androgens + irregular periods + polycystic ovaries
- **Non-PCO PCOS**: High androgens + irregular periods but normal-appearing ovaries  
- **Ovulatory PCOS**: High androgens + polycystic ovaries but regular periods
- **Lean PCOS**: Normal weight but with PCOS symptoms (20-30% of cases)

**Common symptoms:** irregular periods, excess hair growth, acne, weight gain, insulin resistance, and difficulty conceiving.

**When to see a doctor:** If you experience irregular periods for several months, excessive hair growth, persistent acne, or difficulty losing weight despite healthy lifestyle changes.

It's important to consult with healthcare providers for proper diagnosis and treatment planning.`,
        ingredients: []
      };
    } else if (lowerMessage.includes('endometriosis')) {
      return {
        message: `Endometriosis is a condition where tissue similar to the uterine lining grows outside the uterus.

**Common symptoms:** Severe menstrual cramps, chronic pelvic pain, pain during intercourse, heavy periods, and sometimes infertility.

**Types:** Superficial endometriosis, ovarian endometriomas (chocolate cysts), and deep infiltrating endometriosis.

**Risk factors:** Family history, never giving birth, early menstruation, late menopause, and shorter menstrual cycles.

Diagnosis typically requires pelvic examination, imaging, and sometimes laparoscopy. Treatment options vary based on severity and symptoms.

It's important to consult with healthcare providers for proper diagnosis and treatment planning.`,
        ingredients: []
      };
    } else if (lowerMessage.includes('thyroid')) {
      return {
        message: `Thyroid disorders affect how your body uses energy and can impact many body functions.

**Types:**
- **Hypothyroidism**: Underactive thyroid (more common in women)
- **Hyperthyroidism**: Overactive thyroid
- **Hashimoto's**: Autoimmune condition causing hypothyroidism
- **Graves' disease**: Autoimmune condition causing hyperthyroidism

**Common symptoms of hypothyroidism:** Fatigue, weight gain, cold sensitivity, dry skin, hair loss, constipation, and depression.

**Common symptoms of hyperthyroidism:** Weight loss, rapid heartbeat, anxiety, heat sensitivity, tremors, and difficulty sleeping.

Regular blood tests (TSH, T3, T4) help diagnose and monitor thyroid function.

It's important to consult with healthcare providers for proper diagnosis and treatment planning.`,
        ingredients: []
      };
    }
    
    // Default general health response
    return {
      message: `I can provide general health information and answer questions about women's health conditions. For specific dietary and supplement recommendations, please ask about what you'd like to eat, add to your diet, or specific nutrition questions.

It's important to consult with healthcare providers for proper diagnosis and treatment planning.`,
      ingredients: []
    };
  }
  
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
  } else if (lowerMessage.includes('bloating') || lowerMessage.includes('digestion') || lowerMessage.includes('gas') || lowerMessage.includes('stomach')) {
    demoMessage = `Bloating and digestive discomfort can be managed with specific foods and ingredients that support healthy digestion. Here are evidence-based options:`;
    ingredients = [
      {
        name: "Ginger Root",
        description: "Natural digestive aid that stimulates gastric motility and reduces bloating by 40% in clinical studies",
        emoji: "🫚",
        lazy: "Take 250mg ginger capsules before meals or keep crystallized ginger pieces handy",
        tasty: "Make fresh ginger tea with lemon and honey, or add grated ginger to smoothies",
        healthy: "Consume 1g fresh ginger daily: steep 1 inch piece in hot water for 10 minutes, drink 30 minutes before meals"
      },
      {
        name: "Peppermint",
        description: "Antispasmodic herb that relaxes digestive muscles and reduces IBS symptoms including bloating",
        emoji: "🌿",
        lazy: "Drink peppermint tea bags after meals or take enteric-coated peppermint oil capsules",
        tasty: "Make iced peppermint tea with fresh mint leaves and cucumber slices",
        healthy: "Take 0.2-0.4ml peppermint oil in enteric-coated capsules 30-60 minutes before meals"
      },
      {
        name: "Fennel Seeds",
        description: "Traditional digestive aid that reduces gas formation and promotes healthy gut motility",
        emoji: "🌱",
        lazy: "Chew 1 tsp fennel seeds after meals or steep in hot water as tea",
        tasty: "Add toasted fennel seeds to roasted vegetables or make fennel tea with honey",
        healthy: "Steep 1 tsp crushed fennel seeds in hot water for 15 minutes, drink after heavy meals"
      }
    ];
  } else if (lowerMessage.includes('luteal') || lowerMessage.includes('luteal phase')) {
    demoMessage = `Here are the top 3 foods to include during your luteal phase for hormonal balance and symptom relief:`;
    ingredients = [
      {
        name: "Sesame Seeds",
        description: "Rich in lignans that support progesterone production during luteal phase",
        emoji: "🌱",
        lazy: "Take 1 tbsp sesame seeds daily or sesame seed butter on toast",
        tasty: "Sprinkle toasted sesame seeds on salads or make tahini smoothie bowls",
        healthy: "Consume 1-2 tbsp raw sesame seeds daily with vitamin E-rich foods for optimal hormone support"
      },
      {
        name: "Sunflower Seeds",
        description: "High in vitamin E and selenium to support luteal phase hormone production",
        emoji: "🌻",
        lazy: "Snack on 1/4 cup roasted sunflower seeds or sunflower seed butter",
        tasty: "Add sunflower seeds to homemade granola or trail mix with dark chocolate",
        healthy: "Eat 1-2 tbsp raw sunflower seeds daily during luteal phase for vitamin E and progesterone support"
      },
      {
        name: "Magnesium-Rich Leafy Greens",
        description: "Combat PMS symptoms, reduce bloating and support mood stability",
        emoji: "🥬",
        lazy: "Add pre-washed spinach to smoothies or grab bagged salad mixes",
        tasty: "Make green smoothies with spinach, banana, almond butter and dates",
        healthy: "Consume 2-3 cups dark leafy greens daily - spinach, kale, Swiss chard for 200mg+ magnesium"
      }
    ];
  } else if (lowerMessage.includes('follicular') || lowerMessage.includes('follicular phase')) {
    demoMessage = `Here are the top 3 foods to include during your follicular phase for estrogen support and energy:`;
    ingredients = [
      {
        name: "Flax Seeds",
        description: "High in lignans that support healthy estrogen metabolism during follicular phase",
        emoji: "🌾",
        lazy: "Take 1 tbsp ground flaxseed daily mixed in water or yogurt",
        tasty: "Add ground flax to smoothies, oatmeal, or homemade muffins",
        healthy: "Consume 1-2 tbsp freshly ground flaxseeds daily for optimal lignan content and omega-3s"
      },
      {
        name: "Pumpkin Seeds",
        description: "Rich in zinc and iron to support healthy follicle development and energy",
        emoji: "🎃",
        lazy: "Snack on 1/4 cup raw or roasted pumpkin seeds daily",
        tasty: "Toast pumpkin seeds with sea salt and herbs, or add to trail mix",
        healthy: "Eat 1-2 tbsp raw pumpkin seeds daily for zinc, iron, and magnesium during follicular phase"
      },
      {
        name: "Citrus Fruits",
        description: "High in vitamin C and folate to support healthy hormone production and energy",
        emoji: "🍊",
        lazy: "Eat 1-2 fresh oranges or grapefruits daily, or drink fresh citrus juice",
        tasty: "Make citrus salads with orange, grapefruit, and fresh mint",
        healthy: "Consume 2-3 servings of fresh citrus daily for vitamin C, folate, and antioxidants"
      }
    ];
  } else if (lowerMessage.includes('menstrual') || lowerMessage.includes('menstrual phase')) {
    demoMessage = `Here are the top 3 foods to include during your menstrual phase for iron support and pain relief:`;
    ingredients = [
      {
        name: "Dark Leafy Greens",
        description: "High in iron and folate to replenish nutrients lost during menstruation",
        emoji: "🥬",
        lazy: "Add baby spinach to smoothies or buy pre-washed salad mixes",
        tasty: "Sauté spinach with garlic and lemon, or add to pasta dishes",
        healthy: "Consume 3-4 cups of dark leafy greens daily with vitamin C for enhanced iron absorption"
      },
      {
        name: "Ginger Root",
        description: "Natural anti-inflammatory that reduces menstrual cramps and nausea",
        emoji: "🫚",
        lazy: "Take ginger capsules or drink pre-made ginger tea",
        tasty: "Make fresh ginger tea with honey and lemon, or add to smoothies",
        healthy: "Consume 1-2g fresh ginger daily as tea or in cooking for anti-inflammatory effects"
      },
      {
        name: "Red Meat or Lentils",
        description: "Rich in heme iron (meat) or plant iron (lentils) to prevent anemia",
        emoji: "🥩",
        lazy: "Choose lean ground beef or canned lentils for quick meals",
        tasty: "Make beef stir-fry or hearty lentil curry with warming spices",
        healthy: "Include 3-4oz lean red meat or 1 cup cooked lentils daily during menstruation"
      }
    ];
  } else if (lowerMessage.includes('ovulation') || lowerMessage.includes('ovulation phase')) {
    demoMessage = `Here are the top 3 foods to include during your ovulation phase for peak fertility and energy:`;
    ingredients = [
      {
        name: "Avocados",
        description: "Rich in healthy fats and folate that support egg quality and hormone production",
        emoji: "🥑",
        lazy: "Add half an avocado to toast, salads, or smoothies daily",
        tasty: "Make guacamole, avocado chocolate mousse, or creamy pasta sauces",
        healthy: "Consume 1/2 to 1 whole avocado daily for monounsaturated fats and folate"
      },
      {
        name: "Wild-Caught Salmon",
        description: "High in omega-3 fatty acids that support egg quality and reduce inflammation",
        emoji: "🐟",
        lazy: "Buy pre-cooked salmon or canned wild salmon for quick meals",
        tasty: "Grill salmon with herbs, or make salmon salad with avocado",
        healthy: "Include 3-4oz wild salmon 2-3 times per week for optimal omega-3 intake"
      },
      {
        name: "Brazil Nuts",
        description: "Extremely high in selenium, crucial for egg protection and fertility",
        emoji: "🥜",
        lazy: "Eat 2-3 Brazil nuts daily as a quick snack",
        tasty: "Add chopped Brazil nuts to granola, yogurt, or energy balls",
        healthy: "Consume 2-3 Brazil nuts daily for 200mcg selenium - optimal for fertility support"
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

// Generate research-based ingredient cards for menstrual cycle phases
async function generateResearchBasedCycleResponse(message: string, onboardingData: any, openai: OpenAI): Promise<ChatResponse> {
  const lowerMessage = message.toLowerCase();
  let phase = '';
  let searchQuery = '';
  
  if (lowerMessage.includes('luteal')) {
    phase = 'Luteal Phase';
    searchQuery = 'luteal phase nutrition seed cycling sesame sunflower seeds progesterone support foods';
  } else if (lowerMessage.includes('follicular')) {
    phase = 'Follicular Phase';
    searchQuery = 'follicular phase nutrition flax pumpkin seeds estrogen support menstrual cycle foods';
  } else if (lowerMessage.includes('menstrual')) {
    phase = 'Menstrual Phase';
    searchQuery = 'menstrual phase nutrition iron foods menstruation cramps ginger leafy greens';
  } else if (lowerMessage.includes('ovulation')) {
    phase = 'Ovulation Phase';
    searchQuery = 'ovulation phase nutrition fertility foods omega-3 selenium folate egg quality';
  }

  // Get research data for this phase
  let researchMatches = [];
  try {
    researchMatches = await researchService.searchWithSmartScraping(searchQuery, 5);
    console.log(`Found ${researchMatches.length} research matches for ${phase}`);
  } catch (error) {
    console.log('Research service unavailable, using fallback');
    return generateDemoResponse(message, onboardingData);
  }

  if (researchMatches.length === 0) {
    return generateDemoResponse(message, onboardingData);
  }

  // Extract foods and generate ingredient cards using OpenAI
  const researchContext = researchMatches.map(match => 
    `Study: ${match.metadata?.title || 'Research Paper'}
    Content: ${match.metadata?.content?.substring(0, 500)}...
    Source: ${match.metadata?.url || 'Scientific Database'}`
  ).join('\n\n');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition researcher who extracts specific food recommendations from scientific research. Based on the research provided, identify the top 3 foods/nutrients mentioned for ${phase} support.

For each food, provide:
1. Name of the food/nutrient
2. Scientific description of its benefits based on the research
3. Lazy way to consume it (simple, convenient)
4. Tasty way to consume it (flavorful, appealing)
5. Healthy way to consume it (optimal dosage/preparation)
6. Appropriate emoji

Return ONLY a JSON array with exactly 3 objects in this format:
[
  {
    "name": "Food Name",
    "description": "Research-based description of benefits",
    "emoji": "🌱",
    "lazy": "Simple consumption method",
    "tasty": "Appealing preparation method", 
    "healthy": "Optimal dosage and preparation for maximum benefit"
  }
]`
        },
        {
          role: 'user',
          content: `Extract the top 3 foods for ${phase} from this research:\n\n${researchContext}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return generateDemoResponse(message, onboardingData);
    }

    // Parse the JSON response
    let ingredients = [];
    try {
      ingredients = JSON.parse(content);
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('Invalid format');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return generateDemoResponse(message, onboardingData);
    }

    return {
      message: `Here are the top ${ingredients.length} research-backed foods for your ${phase.toLowerCase()}:`,
      ingredients: ingredients
    };

  } catch (error) {
    console.error('OpenAI extraction failed:', error);
    return generateDemoResponse(message, onboardingData);
  }
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

  // Check if user is asking for meal plans
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('meal plan') || lowerQuestion.includes('what to eat') || 
      lowerQuestion.includes('food plan') || lowerQuestion.includes('diet plan') ||
      lowerQuestion.includes('recipes for') || lowerQuestion.includes('meals for')) {
    
    // Extract health conditions for meal planning context
    const healthConditions = nutritionistService.extractHealthConditions(onboardingData || {});
    
    return {
      message: `I can create a personalized meal plan for you! Based on your profile${healthConditions.length > 0 ? ` and ${healthConditions.join(', ')} conditions` : ''}, I'll design meals that address your specific health needs. Use the meal plan generator in your dashboard to select your preferred cuisine (Indian, Mediterranean, Japanese, or Mexican) and I'll create a complete daily meal plan with recipes, shopping lists, and nutritional guidance tailored to your needs.`,
      ingredients: [
        {
          name: "AI Meal Planning",
          description: "Personalized meal plans based on your health conditions and cuisine preferences",
          emoji: "🍽️",
          lazy: "Click 'Generate Meal Plan' button and select your preferred cuisine",
          tasty: "Choose from authentic Indian, Mediterranean, Japanese, or Mexican recipes",
          healthy: "Get evidence-based meal timing, therapeutic ingredients, and nutritional optimization"
        }
      ]
    };
  }

  // Get research-backed information using smart scraping - STRICT RESEARCH ONLY
  let researchMatches = [];
  try {
    researchMatches = await researchService.searchWithSmartScraping(question, 5);
    console.log(`Using existing research data for query: ${question}`);
  } catch (error) {
    console.log('Research service unavailable');
  }

  // Only respond if we have research data
  if (researchMatches.length === 0) {
    return {
      message: "I can only provide information based on scientific research papers stored in our database. Your question doesn't match our current research collection. Please ask about women's health topics like PCOS, thyroid conditions, endometriosis, hormonal balance, fertility, menstrual health, or nutrition for specific health conditions.",
      ingredients: []
    };
  }

  const researchContext = `
SCIENTIFIC RESEARCH EVIDENCE:
${researchMatches.map(match => `
Study: ${match.metadata?.title || 'Research Paper'}
Content: ${match.metadata?.content?.substring(0, 400)}...
Source: ${match.metadata?.url || 'Scientific Database'}
`).join('\n')}

CRITICAL: Base your response ONLY on the scientific research provided above. Do not add information from general knowledge.`;

  // Determine if this is a diet/nutrition question vs general health information
  const isDietQuestion = /\b(eat|food|diet|nutrition|meal|recipe|cook|supplement|ingredient|consume|drink|take|add|help with|bloating|digestion)\b/i.test(question);
  
  let systemPrompt;
  
  if (isDietQuestion) {
    systemPrompt = `You are a women's health nutritionist who ONLY provides information based on scientific research papers. Use ONLY the research evidence provided below to answer questions about foods, nutrients, and dietary interventions.

${ENHANCED_TRAINING_PROMPT}

STRICT IMPLEMENTATION REQUIREMENTS:

LAZY METHOD must include:
- Specific dosage/amount (e.g., "2 capsules", "1 tsp powder", "1 cup tea")
- Convenience factor (e.g., "with breakfast", "pre-made", "tea bags")
- Zero cooking or complex preparation
- Grab-and-go solutions

TASTY METHOD must include:
- Flavor enhancement (e.g., "chocolate", "honey", "vanilla")
- Culinary enjoyment (e.g., "smoothie", "latte", "energy balls", "herbal tea")
- Creative preparation that feels like a treat
- Pleasant taste combinations

HEALTHY METHOD must include:
- Precise dosage with units (mg, mcg, g, IU, ml, tsp)
- Absorption optimization (e.g., "with black pepper", "on empty stomach", "after meals")
- Timing guidance (e.g., "30 minutes before meals", "with dinner", "between meals")
- Bioavailability enhancement

Respond with exactly this JSON format:
{
  "message": "Your helpful response about foods/ingredients that help with the specific concern (include disclaimer about consulting healthcare providers)",
  "ingredients": [
    {
      "name": "Food/Ingredient Name",
      "description": "Health benefits explanation based on research",
      "emoji": "🌿",
      "lazy": "[CONVENIENCE] Specific easy method with dosage/serving",
      "tasty": "[FLAVOR] Enjoyable culinary preparation",
      "healthy": "[OPTIMAL] Evidence-based dosage/timing with absorption guidance"
    }
  ]
}

Always provide 2-3 food/ingredient recommendations that specifically address the user's question.${userContext}${researchContext}`;
  } else {
    systemPrompt = `You are a warm, caring women's health coach speaking to a patient in a friendly, conversational tone. Use the scientific research provided to give helpful, compassionate guidance about health conditions.

TONE AND APPROACH:
- Speak like a supportive healthcare professional who genuinely cares
- Use encouraging, reassuring language
- Be conversational but professional
- Acknowledge concerns and validate feelings
- Provide hope and actionable guidance

FORMATTING REQUIREMENTS:
- Use bullet points for easy reading
- Structure information clearly with:
  • Key points as bullet points
  • Specific recommendations as bullet points
  • Benefits as bullet points
- Make information scannable and digestible
- Include seed cycling information when relevant to menstrual health

CONTENT GUIDELINES:
- Base your response on the scientific research provided
- Explain symptoms clearly and help the person understand what to look for
- Always encourage seeing a healthcare professional for proper diagnosis and treatment
- Provide practical next steps they can take
- Use phrases like "Many women experience...", "You're not alone in this...", "The good news is..."

Focus on explaining:
- What the condition is in understandable terms
- Common symptoms and how they might feel
- When to seek medical attention (be specific)
- Reassurance that help is available
- Basic lifestyle support (based on research)

Respond with exactly this JSON format:
{
  "message": "Your warm, conversational response based on research evidence (always include friendly encouragement to see a healthcare provider for personalized care)",
  "ingredients": []
}

Keep ingredients array empty for general health information questions.${userContext}${researchContext}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No OpenAI response');

    // Clean and parse the JSON response
    let cleanContent = content.trim();
    
    // Remove any markdown code blocks if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Attempt to extract JSON if response contains extra text
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanContent);
    
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
        next();
      } else {
        // Verify Firebase token
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        
        // Get or create user in our storage
        let user = await storage.getUserByFirebaseUid(decodedToken.uid);
        
        if (!user) {
          // Create user if it doesn't exist
          user = await storage.createUser({
            firebaseUid: decodedToken.uid,
            email: decodedToken.email || '',
            name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User'
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

  // Logout user and clear chat history for privacy
  app.post('/api/auth/logout', requireAuth, async (req: any, res: any) => {
    try {
      await storage.clearChatHistory(req.user.id);
      res.json({ success: true, message: 'Logged out successfully and chat history cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
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
      
      // Check if this is a luteal phase query that should use demo response with ingredient cards
      const lowerMessage = message.toLowerCase();
      const isLutealPhaseQuery = lowerMessage.includes('luteal') || lowerMessage.includes('luteal phase');
      const isFollicularPhaseQuery = lowerMessage.includes('follicular') || lowerMessage.includes('follicular phase');
      const isMenstrualPhaseQuery = lowerMessage.includes('menstrual') || lowerMessage.includes('menstrual phase');
      const isOvulationPhaseQuery = lowerMessage.includes('ovulation') || lowerMessage.includes('ovulation phase');
      
      let response;
      
      // Use research-based response for cycle phase queries
      if (isLutealPhaseQuery || isFollicularPhaseQuery || isMenstrualPhaseQuery || isOvulationPhaseQuery) {
        response = await generateResearchBasedCycleResponse(message, onboardingData, openai);
      } else {
        // Try ChatGPT with fast timeout, fallback to demo if needed
        try {
          response = await Promise.race([
            generateChatGPTResponse(openai, message, onboardingData),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]) as ChatResponse;
        } catch (error) {
          console.error('ChatGPT API failed, using demo response:', error);
          response = generateDemoResponse(message, onboardingData);
        }
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

  // Generate personalized meal plan
  app.post('/api/nutrition/meal-plan', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference } = req.body;
      
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
        message: `Personalized ${cuisinePreference} meal plan generated for your health needs`
      });

    } catch (error) {
      console.error('Error generating meal plan:', error);
      res.status(500).json({ 
        error: 'Failed to generate meal plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get available cuisines and health conditions
  app.get('/api/nutrition/options', requireAuth, async (req: any, res: any) => {
    try {
      res.json({
        success: true,
        cuisines: [
          { id: 'indian', name: 'Indian', description: 'Spice-rich, turmeric-based healing cuisine' },
          { id: 'mediterranean', name: 'Mediterranean', description: 'Anti-inflammatory, omega-3 rich foods' },
          { id: 'japanese', name: 'Japanese', description: 'Fermented foods, seaweed, clean eating' },
          { id: 'mexican', name: 'Mexican', description: 'Bean-rich, antioxidant-packed vegetables' },
          { id: 'american', name: 'American', description: 'Whole foods, lean proteins, fresh produce' }
        ],
        supportedConditions: [
          { id: 'pcos', name: 'PCOS', focus: 'Insulin sensitivity, hormone balance' },
          { id: 'endometriosis', name: 'Endometriosis', focus: 'Anti-inflammatory, pain management' },
          { id: 'thyroid_hypo', name: 'Hypothyroidism', focus: 'Metabolism support, nutrient density' },
          { id: 'stress_adrenal', name: 'Chronic Stress', focus: 'Cortisol regulation, adrenal support' }
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get nutrition options' });
    }
  });

  // Generate weekly meal plan
  app.post('/api/nutrition/meal-plan/weekly', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference } = req.body;
      
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

      res.json({
        success: true,
        weeklyPlan,
        detectedConditions: healthConditions,
        message: `Personalized ${cuisinePreference} weekly meal plan generated for your health needs`
      });

    } catch (error) {
      console.error('Error generating weekly meal plan:', error);
      res.status(500).json({ 
        error: 'Failed to generate weekly meal plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Generate monthly meal plan
  app.post('/api/nutrition/meal-plan/monthly', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference } = req.body;
      
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

      res.json({
        success: true,
        monthlyPlan,
        detectedConditions: healthConditions,
        message: `Personalized ${cuisinePreference} monthly meal plan generated for your health needs`
      });

    } catch (error) {
      console.error('Error generating monthly meal plan:', error);
      res.status(500).json({ 
        error: 'Failed to generate monthly meal plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Generate and download weekly meal plan PDF
  app.post('/api/nutrition/meal-plan/weekly/pdf', requireAuth, async (req: any, res: any) => {
    try {
      const { cuisinePreference } = req.body;
      
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

      // Generate beautifully formatted HTML using the PDF generator service
      const pdfBuffer = await pdfGeneratorService.generateWeeklyMealPlanPDF(
        weeklyPlan,
        { user: req.user, onboarding: onboardingData },
        cuisinePreference
      );

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-meal-plan-${cuisinePreference.toLowerCase()}.html"`);
      res.send(pdfBuffer);

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
      const { cuisinePreference } = req.body;
      
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

      // Generate beautifully formatted HTML using the PDF generator service
      const pdfBuffer = await pdfGeneratorService.generateMonthlyMealPlanPDF(
        monthlyPlan,
        { user: req.user, onboarding: onboardingData },
        cuisinePreference
      );

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-meal-plan-${cuisinePreference.toLowerCase()}.html"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating monthly meal plan PDF:', error);
      res.status(500).json({ 
        error: 'Failed to generate monthly meal plan PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}