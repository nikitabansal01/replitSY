import OpenAI from 'openai';
import { researchService } from './research';

export interface HealthCondition {
  name: string;
  dietary_focus: string[];
  foods_to_include: string[];
  foods_to_avoid: string[];
  meal_timing_considerations: string[];
}

export interface CuisineProfile {
  name: string;
  common_ingredients: string[];
  cooking_methods: string[];
  staple_foods: string[];
  healthy_adaptations: string[];
}

export interface MealPlanItem {
  name: string;
  ingredients: string[];
  preparation_time: string;
  cooking_method: string;
  nutritional_focus: string[];
  health_benefits: string[];
  cultural_authenticity: string;
}

export interface DailyMealPlan {
  condition_focus: string[];
  cuisine_style: string;
  menstrual_phase?: string;
  cycle_specific_recommendations?: {
    phase: string;
    seed_cycling: string[];
    hormone_support_foods: string[];
    phase_benefits: string[];
  };
  breakfast: MealPlanItem;
  lunch: MealPlanItem;
  dinner: MealPlanItem;
  snacks: MealPlanItem[];
  daily_guidelines: {
    foods_to_emphasize: string[];
    foods_to_limit: string[];
    hydration_tips: string[];
    timing_recommendations: string[];
    cycle_support?: string[];
  };
}

// Comprehensive health condition database
export const HEALTH_CONDITIONS: Record<string, HealthCondition> = {
  pcos: {
    name: "PCOS (Polycystic Ovary Syndrome)",
    dietary_focus: ["insulin_sensitivity", "anti_inflammatory", "hormone_balance"],
    foods_to_include: [
      "low_glycemic_carbs", "lean_proteins", "omega3_fats", "fiber_rich_foods",
      "anti_inflammatory_spices", "chromium_rich_foods", "spearmint_tea"
    ],
    foods_to_avoid: [
      "refined_sugars", "processed_foods", "high_glycemic_carbs", 
      "trans_fats", "excessive_dairy", "inflammatory_oils"
    ],
    meal_timing_considerations: [
      "eat_protein_with_carbs", "smaller_frequent_meals", "avoid_skipping_breakfast",
      "limit_late_night_eating"
    ]
  },
  endometriosis: {
    name: "Endometriosis",
    dietary_focus: ["anti_inflammatory", "estrogen_balance", "pain_management"],
    foods_to_include: [
      "omega3_fatty_acids", "antioxidant_rich_foods", "cruciferous_vegetables",
      "turmeric", "ginger", "green_tea", "fiber_rich_foods"
    ],
    foods_to_avoid: [
      "red_meat", "processed_foods", "caffeine_excess", "alcohol",
      "high_fat_dairy", "refined_sugars", "gluten_potentially"
    ],
    meal_timing_considerations: [
      "regular_meal_times", "avoid_inflammatory_foods_during_cycle"
    ]
  },
  thyroid_hypo: {
    name: "Hypothyroidism",
    dietary_focus: ["thyroid_support", "metabolism_boost", "nutrient_density"],
    foods_to_include: [
      "iodine_rich_foods", "selenium_sources", "zinc_foods", "vitamin_d_foods",
      "lean_proteins", "complex_carbs", "brazil_nuts"
    ],
    foods_to_avoid: [
      "excessive_soy", "raw_cruciferous_excess", "gluten_potentially",
      "processed_foods", "excess_fiber_with_meds"
    ],
    meal_timing_considerations: [
      "take_meds_empty_stomach", "wait_before_eating", "consistent_meal_times"
    ]
  },
  stress_adrenal: {
    name: "Chronic Stress & Adrenal Support",
    dietary_focus: ["cortisol_regulation", "blood_sugar_stability", "nervous_system_support"],
    foods_to_include: [
      "adaptogenic_herbs", "magnesium_rich_foods", "b_vitamin_sources",
      "complex_carbs", "healthy_fats", "protein_each_meal"
    ],
    foods_to_avoid: [
      "caffeine_excess", "refined_sugars", "alcohol", "processed_foods",
      "skipping_meals", "inflammatory_foods"
    ],
    meal_timing_considerations: [
      "eat_within_hour_of_waking", "protein_rich_breakfast", "regular_intervals"
    ]
  }
};

// Menstrual cycle phase support with seed cycling
export const MENSTRUAL_CYCLE_PHASES = {
  follicular: {
    name: "Follicular Phase",
    days: "1-14",
    hormone_focus: ["estrogen_rising", "FSH_support"],
    seed_cycling: ["flax_seeds", "pumpkin_seeds"],
    supporting_foods: [
      "dark_leafy_greens", "cruciferous_vegetables", "citrus_fruits",
      "lean_proteins", "complex_carbs", "iron_rich_foods"
    ],
    benefits: [
      "Flax seeds contain lignans that help metabolize estrogen",
      "Pumpkin seeds provide zinc for hormone production",
      "Iron-rich foods support energy during menstruation",
      "Cruciferous vegetables aid estrogen detoxification"
    ],
    lazy_incorporation: [
      "Add 1 tbsp ground flax seeds to smoothies",
      "Sprinkle pumpkin seeds on salads or yogurt",
      "Mix seeds into overnight oats"
    ],
    tasty_incorporation: [
      "Flax seed energy balls with dates and cocoa",
      "Roasted pumpkin seeds with spices as snacks",
      "Flax seed crackers with hummus"
    ],
    healthy_incorporation: [
      "Ground flax in morning smoothie with spinach",
      "Raw pumpkin seeds in Buddha bowls",
      "Flax seed oil in salad dressings"
    ]
  },
  luteal: {
    name: "Luteal Phase", 
    days: "15-28",
    hormone_focus: ["progesterone_support", "estrogen_balance"],
    seed_cycling: ["sesame_seeds", "sunflower_seeds"],
    supporting_foods: [
      "magnesium_rich_foods", "b6_sources", "healthy_fats",
      "complex_carbs", "anti_inflammatory_foods"
    ],
    benefits: [
      "Sesame seeds contain lignans that support progesterone",
      "Sunflower seeds provide vitamin E for hormone balance",
      "Magnesium helps reduce PMS symptoms",
      "B6 supports mood and reduces bloating"
    ],
    lazy_incorporation: [
      "Add 1 tbsp tahini (sesame paste) to toast",
      "Handful of sunflower seeds as afternoon snack",
      "Mix seeds into trail mix"
    ],
    tasty_incorporation: [
      "Tahini chocolate chip cookies",
      "Sunflower seed butter on apple slices",
      "Sesame seed brittle or halva"
    ],
    healthy_incorporation: [
      "Raw sesame seeds in grain bowls",
      "Sunflower seed oil in cooking",
      "Tahini in nutrient-dense smoothies"
    ]
  }
};

// Cuisine profiles with healthy adaptations
export const CUISINE_PROFILES: Record<string, CuisineProfile> = {
  indian: {
    name: "Indian",
    common_ingredients: [
      "turmeric", "cumin", "coriander", "ginger", "garlic", "cardamom",
      "lentils", "chickpeas", "yogurt", "ghee", "coconut"
    ],
    cooking_methods: ["tempering", "slow_cooking", "steaming", "roasting"],
    staple_foods: ["rice", "roti", "dal", "vegetables", "paneer"],
    healthy_adaptations: [
      "use_brown_rice", "reduce_oil", "increase_vegetables", "use_greek_yogurt",
      "add_more_spices", "include_millets"
    ]
  },
  mediterranean: {
    name: "Mediterranean",
    common_ingredients: [
      "olive_oil", "tomatoes", "garlic", "herbs", "lemon", "olives",
      "fish", "nuts", "seeds", "whole_grains"
    ],
    cooking_methods: ["grilling", "roasting", "sautéing", "steaming"],
    staple_foods: ["fish", "vegetables", "legumes", "whole_grains", "fruits"],
    healthy_adaptations: [
      "emphasize_fish", "use_extra_virgin_olive_oil", "increase_vegetables",
      "choose_whole_grains", "add_nuts_seeds"
    ]
  },
  japanese: {
    name: "Japanese",
    common_ingredients: [
      "miso", "seaweed", "fish", "soy", "rice", "vegetables",
      "mushrooms", "green_tea", "sesame", "ginger"
    ],
    cooking_methods: ["steaming", "grilling", "simmering", "fermenting"],
    staple_foods: ["rice", "fish", "vegetables", "miso_soup", "tofu"],
    healthy_adaptations: [
      "use_brown_rice", "increase_vegetables", "moderate_sodium",
      "emphasize_omega3_fish", "add_fermented_foods"
    ]
  },
  mexican: {
    name: "Mexican",
    common_ingredients: [
      "beans", "corn", "tomatoes", "peppers", "cilantro", "lime",
      "avocado", "onions", "garlic", "cumin", "chili"
    ],
    cooking_methods: ["grilling", "roasting", "sautéing", "steaming"],
    staple_foods: ["beans", "corn", "vegetables", "lean_proteins", "avocado"],
    healthy_adaptations: [
      "use_whole_grain_tortillas", "increase_vegetables", "use_lean_proteins",
      "add_more_beans", "reduce_cheese", "increase_herbs_spices"
    ]
  },
  american: {
    name: "American",
    common_ingredients: [
      "lean_meats", "poultry", "fish", "eggs", "dairy", "whole_grains",
      "vegetables", "fruits", "nuts", "seeds", "herbs"
    ],
    cooking_methods: ["grilling", "baking", "roasting", "steaming", "sautéing"],
    staple_foods: ["lean_proteins", "whole_grains", "vegetables", "fruits", "healthy_fats"],
    healthy_adaptations: [
      "choose_grass_fed_meats", "use_organic_produce", "whole_grain_alternatives",
      "increase_plant_proteins", "reduce_processed_foods", "emphasize_local_seasonal"
    ]
  }
};

class NutritionistService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 45000
    });
  }

  // Extract health conditions from comprehensive user profile
  determineMenstrualPhase(userProfile: any): string {
    // Check if user has menstrual cycle data
    if (userProfile.menstrualCycle?.lastPeriodDate) {
      const lastPeriod = new Date(userProfile.menstrualCycle.lastPeriodDate);
      const today = new Date();
      const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const cycleLength = userProfile.menstrualCycle?.cycleLength || 28;
      
      const dayInCycle = daysSinceLastPeriod % cycleLength;
      
      if (dayInCycle <= 14) {
        return 'follicular';
      } else {
        return 'luteal';
      }
    }
    
    // Default to follicular if no cycle data
    return 'follicular';
  }

  extractHealthConditions(userProfile: any): string[] {
    const conditions: string[] = [];
    const symptoms = userProfile.symptoms || [];
    const medicalConditions = userProfile.medicalConditions || [];
    const goals = userProfile.goals || [];
    const lifestyle = userProfile.lifestyle || {};

    // Map diagnosed medical conditions directly
    medicalConditions.forEach((condition: string) => {
      const lowerCondition = condition.toLowerCase();
      if (lowerCondition.includes('pcos') || lowerCondition.includes('polycystic')) {
        conditions.push('pcos');
      }
      if (lowerCondition.includes('endometriosis')) {
        conditions.push('endometriosis');
      }
      if (lowerCondition.includes('thyroid') || lowerCondition.includes('hypo') || lowerCondition.includes('hyper')) {
        conditions.push('thyroid_hypo');
      }
      if (lowerCondition.includes('diabetes') || lowerCondition.includes('insulin')) {
        conditions.push('diabetes_insulin');
      }
      if (lowerCondition.includes('depression') || lowerCondition.includes('anxiety')) {
        conditions.push('mental_health');
      }
      if (lowerCondition.includes('ibs') || lowerCondition.includes('digestive') || lowerCondition.includes('celiac')) {
        conditions.push('digestive_health');
      }
      if (lowerCondition.includes('autoimmune')) {
        conditions.push('autoimmune');
      }
    });

    // Enhanced symptom mapping with actual onboarding symptom names
    const symptomMapping: Record<string, string[]> = {
      'irregular_periods': ['pcos'],
      'heavy_bleeding': ['endometriosis', 'pcos'],
      'painful_periods': ['endometriosis'],
      'weight_gain_or_difficulty_losing_weight': ['pcos', 'thyroid_hypo'],
      'fatigue_and_low_energy': ['thyroid_hypo', 'stress_adrenal'],
      'mood_swings': ['pcos', 'stress_adrenal'],
      'hair_loss_or_thinning': ['pcos', 'thyroid_hypo'],
      'acne_or_skin_issues': ['pcos'],
      'bloating_and_digestive_issues': ['digestive_health'],
      'stress_and_anxiety': ['stress_adrenal'],
      'sleep_problems': ['stress_adrenal'],
      'food_cravings': ['pcos', 'stress_adrenal'],
      'hot_flashes': ['hormone_imbalance'],
      'brain_fog_or_memory_issues': ['thyroid_hypo', 'stress_adrenal'],
      'joint_pain_or_stiffness': ['autoimmune', 'endometriosis']
    };

    // Check symptoms against conditions
    symptoms.forEach((symptom: string) => {
      const normalizedSymptom = symptom.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
      const mapped = symptomMapping[normalizedSymptom];
      if (mapped) {
        conditions.push(...mapped);
      }
    });

    // Check stress level from lifestyle data
    if (userProfile.stressLevel === 'High' || userProfile.stressLevel === 'Very High') {
      conditions.push('stress_adrenal');
    }

    // Check sleep quality
    if (userProfile.sleepHours === 'Less than 6') {
      conditions.push('stress_adrenal');
    }

    // Check explicit mentions in goals
    goals.forEach((goal: string) => {
      const lowerGoal = goal.toLowerCase();
      if (lowerGoal.includes('regulate menstrual') || lowerGoal.includes('pcos')) {
        conditions.push('pcos');
      }
      if (lowerGoal.includes('hormone balance')) {
        conditions.push('hormone_balance');
      }
      if (lowerGoal.includes('manage chronic')) {
        conditions.push('general_chronic');
      }
      if (lowerGoal.includes('reduce inflammation')) {
        conditions.push('anti_inflammatory');
      }
    });

    // Remove duplicates and return
    const uniqueConditions = Array.from(new Set(conditions));
    return uniqueConditions.length > 0 ? uniqueConditions : ['general_wellness'];
  }

  // Generate weekly meal plan
  async generateWeeklyMealPlan(
    healthConditions: string[],
    cuisinePreference: string,
    userProfile: any
  ): Promise<any> {
    const weeklyPlan: any = {
      week: 1,
      days: [] as any[],
      weeklyShoppingList: {},
      weeklyNotes: []
    };

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    
    // Generate one base meal plan and create variations for the week
    const baseMealPlan = await this.generateMealPlan(healthConditions, cuisinePreference, userProfile);
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);
      
      // Use base plan for efficiency, could add variations in future
      weeklyPlan.days.push({
        dayName: dayNames[i],
        date: dayDate.toLocaleDateString(),
        meals: baseMealPlan
      });
    }

    // Generate consolidated shopping list
    weeklyPlan.weeklyShoppingList = this.generateWeeklyShoppingList(weeklyPlan.days);
    
    return weeklyPlan;
  }

  // Generate monthly meal plan
  async generateMonthlyMealPlan(
    healthConditions: string[],
    cuisinePreference: string,
    userProfile: any
  ): Promise<any> {
    const today = new Date();
    const monthlyPlan: any = {
      month: today.toLocaleDateString('en-US', { month: 'long' }),
      year: today.getFullYear(),
      weeks: [] as any[],
      monthlyShoppingList: {},
      nutritionalSummary: {
        focusAreas: healthConditions,
        keyNutrients: ['protein', 'fiber', 'omega-3', 'vitamins', 'minerals'],
        healthGoals: ['hormonal balance', 'energy optimization', 'digestive health']
      }
    };

    // Generate base weekly plan and create variations for the month
    const baseWeeklyPlan = await this.generateWeeklyMealPlan(healthConditions, cuisinePreference, userProfile);
    
    for (let week = 1; week <= 4; week++) {
      const weeklyVariation = { ...baseWeeklyPlan, week };
      monthlyPlan.weeks.push(weeklyVariation);
    }

    // Generate consolidated monthly shopping list
    monthlyPlan.monthlyShoppingList = this.generateMonthlyShoppingList(monthlyPlan.weeks);

    return monthlyPlan;
  }

  // Generate personalized meal plan
  async generateMealPlan(
    healthConditions: string[],
    cuisinePreference: string,
    userProfile: any
  ): Promise<DailyMealPlan> {
    const conditions = healthConditions.map(c => HEALTH_CONDITIONS[c]).filter(Boolean);
    const cuisine = CUISINE_PROFILES[cuisinePreference.toLowerCase()] || CUISINE_PROFILES.mediterranean;

    // Determine menstrual cycle phase for phase-specific recommendations
    const currentPhase = this.determineMenstrualPhase(userProfile);
    const phaseData = MENSTRUAL_CYCLE_PHASES[currentPhase as keyof typeof MENSTRUAL_CYCLE_PHASES];

    // Get scientific research data including seed cycling
    let researchContext = '';
    try {
      const researchQuery = `nutrition diet meal planning ${healthConditions.join(' ')} ${cuisinePreference} seed cycling menstrual cycle ${currentPhase}`;
      const researchMatches = await researchService.searchWithSmartScraping(researchQuery, 3);
      if (researchMatches.length > 0) {
        researchContext = `\n\nSCIENTIFIC RESEARCH CONTEXT:\n${researchMatches.map(match => 
          `- ${match.metadata?.title}: ${match.metadata?.content?.substring(0, 300)}...`
        ).join('\n')}\n\nUse this evidence-based research to inform your meal planning recommendations.`;
      }
    } catch (error) {
      console.log('Research data unavailable for meal planning, using condition mappings');
    }

    // Build comprehensive nutritional requirements
    const nutritionalFocus = conditions.flatMap(c => c.dietary_focus);
    const includeIngredients = conditions.flatMap(c => c.foods_to_include);
    const avoidIngredients = conditions.flatMap(c => c.foods_to_avoid);
    const timingConsiderations = conditions.flatMap(c => c.meal_timing_considerations);

    const systemPrompt = `You are an expert nutritionist specializing in women's health conditions. Create a personalized daily meal plan with menstrual cycle phase-specific recommendations.

HEALTH CONDITIONS: ${healthConditions.join(', ')}
CUISINE PREFERENCE: ${cuisine.name}
DIETARY FOCUS: ${nutritionalFocus.join(', ')}

MENSTRUAL CYCLE PHASE: ${phaseData.name} (${phaseData.days})
PHASE-SPECIFIC SEED CYCLING: ${phaseData.seed_cycling.join(', ')}
HORMONE SUPPORT: ${phaseData.hormone_focus.join(', ')}
PHASE BENEFITS: ${phaseData.benefits.join(' | ')}

SEED CYCLING INCORPORATION METHODS:
- Lazy: ${phaseData.lazy_incorporation.join(' | ')}
- Tasty: ${phaseData.tasty_incorporation.join(' | ')}
- Healthy: ${phaseData.healthy_incorporation.join(' | ')}

FOODS TO EMPHASIZE: ${includeIngredients.concat(phaseData.supporting_foods).join(', ')}
FOODS TO AVOID/LIMIT: ${avoidIngredients.join(', ')}

CUISINE ELEMENTS TO INCLUDE:
- Common ingredients: ${cuisine.common_ingredients.join(', ')}
- Cooking methods: ${cuisine.cooking_methods.join(', ')}
- Healthy adaptations: ${cuisine.healthy_adaptations.join(', ')}

USER PROFILE:
- Diet type: ${userProfile.diet || 'omnivore'}
- Age: ${userProfile.age || 'adult'}

Create a complete daily meal plan that is:
1. Therapeutically appropriate for the health conditions
2. Includes menstrual cycle phase-specific seed cycling recommendations
3. Culturally authentic to ${cuisine.name} cuisine
4. Practical and accessible
5. Nutritionally balanced

CRITICAL: Respond with ONLY valid JSON, no markdown formatting, no explanations. Use this exact format:

{"condition_focus":["${healthConditions.join('","')}"],"cuisine_style":"${cuisine.name}","menstrual_phase":"${phaseData.name}","cycle_specific_recommendations":{"phase":"${phaseData.name}","seed_cycling":["${phaseData.seed_cycling.join('","')}"],"hormone_support_foods":["${phaseData.supporting_foods.join('","')}"],"phase_benefits":["${phaseData.benefits.join('","')}"]},"breakfast":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"15 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"lunch":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"20 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"dinner":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"25 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"snacks":[{"name":"Snack name","ingredients":["ingredient1","ingredient2"],"preparation_time":"5 minutes","cooking_method":"method","nutritional_focus":["focus1"],"health_benefits":["benefit1"],"cultural_authenticity":"explanation"}],"daily_guidelines":{"foods_to_emphasize":["food1","food2"],"foods_to_limit":["food1","food2"],"hydration_tips":["tip1","tip2"],"timing_recommendations":["timing1","timing2"],"cycle_support":["${phaseData.lazy_incorporation.concat(phaseData.tasty_incorporation, phaseData.healthy_incorporation).join('","')}"]}}${researchContext}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No OpenAI response');

      // Clean the response - remove markdown code blocks and other formatting
      let cleanedContent = content.trim();
      
      // Remove various markdown code block formats
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing non-JSON content
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      }
      
      // Remove any DOCTYPE declarations or HTML tags that might be present
      cleanedContent = cleanedContent.replace(/<!DOCTYPE[^>]*>/gi, '');
      cleanedContent = cleanedContent.replace(/<[^>]*>/g, '');
      
      try {
        const parsed = JSON.parse(cleanedContent);
        console.log('Successfully parsed meal plan JSON');
        return parsed;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Original content length:', content.length);
        console.error('Cleaned content:', cleanedContent.substring(0, 500) + '...');
        
        // Try a more aggressive cleaning approach
        try {
          // Extract JSON between first { and last }
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            const extractedJson = match[0];
            const secondAttempt = JSON.parse(extractedJson);
            console.log('Successfully parsed JSON on second attempt');
            return secondAttempt;
          }
        } catch (secondError) {
          console.error('Second parsing attempt failed:', secondError);
        }
        
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      // Return fallback meal plan instead of throwing error
      return this.generateFallbackMealPlan(healthConditions, cuisinePreference, userProfile);
    }
  }

  // Fallback meal plan generator for when AI fails
  private generateFallbackMealPlan(
    healthConditions: string[],
    cuisinePreference: string,
    userProfile: any
  ): DailyMealPlan {
    const cuisine = CUISINE_PROFILES[cuisinePreference.toLowerCase()] || CUISINE_PROFILES.mediterranean;
    
    if (cuisinePreference.toLowerCase() === 'indian') {
      return {
        condition_focus: healthConditions,
        cuisine_style: "Indian",
        breakfast: {
          name: "Turmeric Golden Milk Oats",
          ingredients: ["steel cut oats", "turmeric", "ginger", "coconut milk", "almonds", "cinnamon"],
          preparation_time: "10 minutes",
          cooking_method: "simmering",
          nutritional_focus: ["anti_inflammatory", "fiber_rich", "protein"],
          health_benefits: ["Reduces inflammation", "Supports digestion", "Provides sustained energy"],
          cultural_authenticity: "Traditional Indian spices like turmeric and ginger with modern breakfast format"
        },
        lunch: {
          name: "Quinoa Dal with Vegetables",
          ingredients: ["quinoa", "red lentils", "spinach", "tomatoes", "cumin", "turmeric", "ghee"],
          preparation_time: "25 minutes",
          cooking_method: "pressure cooking",
          nutritional_focus: ["complete_protein", "iron_rich", "low_glycemic"],
          health_benefits: ["Complete amino acid profile", "High in iron and folate", "Supports blood sugar stability"],
          cultural_authenticity: "Classic dal preparation with protein-rich quinoa adaptation"
        },
        dinner: {
          name: "Grilled Fish with Coconut Curry",
          ingredients: ["salmon", "coconut milk", "curry leaves", "mustard seeds", "green chilies", "cauliflower"],
          preparation_time: "20 minutes",
          cooking_method: "grilling and simmering",
          nutritional_focus: ["omega3_fatty_acids", "anti_inflammatory", "low_carb"],
          health_benefits: ["Rich in omega-3s", "Supports heart health", "Anti-inflammatory properties"],
          cultural_authenticity: "South Indian coconut-based curry with therapeutic spices"
        },
        snacks: [{
          name: "Spiced Roasted Chickpeas",
          ingredients: ["chickpeas", "turmeric", "cumin", "chaat masala", "olive oil"],
          preparation_time: "15 minutes",
          cooking_method: "roasting",
          nutritional_focus: ["plant_protein", "fiber"],
          health_benefits: ["High in protein and fiber", "Supports digestive health"],
          cultural_authenticity: "Traditional Indian street food adapted for health"
        }],
        daily_guidelines: {
          foods_to_emphasize: ["turmeric", "ginger", "lentils", "leafy greens", "coconut"],
          foods_to_limit: ["refined sugar", "processed foods", "excessive oil"],
          hydration_tips: ["Drink warm water with lemon", "Include herbal teas", "Coconut water for electrolytes"],
          timing_recommendations: ["Eat largest meal at lunch", "Light dinner before 7 PM", "Include protein with each meal"]
        }
      };
    }

    // Default Mediterranean fallback
    return {
      condition_focus: healthConditions,
      cuisine_style: "Mediterranean",
      breakfast: {
        name: "Greek Yogurt Bowl with Nuts",
        ingredients: ["Greek yogurt", "walnuts", "berries", "honey", "chia seeds", "cinnamon"],
        preparation_time: "5 minutes",
        cooking_method: "assembly",
        nutritional_focus: ["protein_rich", "omega3", "antioxidants"],
        health_benefits: ["High in protein", "Rich in omega-3s", "Supports gut health"],
        cultural_authenticity: "Traditional Greek breakfast with therapeutic additions"
      },
      lunch: {
        name: "Mediterranean Quinoa Salad",
        ingredients: ["quinoa", "olive oil", "tomatoes", "cucumber", "feta", "olives", "herbs"],
        preparation_time: "15 minutes",
        cooking_method: "boiling and mixing",
        nutritional_focus: ["complete_protein", "healthy_fats", "anti_inflammatory"],
        health_benefits: ["Complete amino acids", "Heart-healthy fats", "Anti-inflammatory"],
        cultural_authenticity: "Classic Mediterranean flavors with modern super grain"
      },
      dinner: {
        name: "Herb-Crusted Salmon with Vegetables",
        ingredients: ["salmon", "olive oil", "herbs", "zucchini", "bell peppers", "lemon"],
        preparation_time: "20 minutes",
        cooking_method: "baking",
        nutritional_focus: ["omega3_fatty_acids", "lean_protein", "vegetables"],
        health_benefits: ["Rich in omega-3s", "Supports brain health", "Anti-inflammatory"],
        cultural_authenticity: "Mediterranean herb preparation with therapeutic focus"
      },
      snacks: [{
        name: "Hummus with Vegetables",
        ingredients: ["chickpeas", "tahini", "olive oil", "lemon", "vegetables"],
        preparation_time: "10 minutes",
        cooking_method: "blending",
        nutritional_focus: ["plant_protein", "fiber", "healthy_fats"],
        health_benefits: ["High in protein", "Supports digestive health", "Provides sustained energy"],
        cultural_authenticity: "Traditional Middle Eastern dip with fresh vegetables"
      }],
      daily_guidelines: {
        foods_to_emphasize: ["olive oil", "fish", "vegetables", "nuts", "herbs"],
        foods_to_limit: ["processed foods", "refined sugars", "trans fats"],
        hydration_tips: ["Drink plenty of water", "Include herbal teas", "Limit caffeine"],
        timing_recommendations: ["Eat regular meals", "Include healthy fats", "Focus on whole foods"]
      }
    };
  }

  // Generate shopping list from meal plan
  generateShoppingList(mealPlan: DailyMealPlan): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      proteins: [],
      vegetables: [],
      grains: [],
      spices: [],
      pantry: [],
      dairy: []
    };

    const allIngredients = [
      ...mealPlan.breakfast.ingredients,
      ...mealPlan.lunch.ingredients,
      ...mealPlan.dinner.ingredients,
      ...mealPlan.snacks.flatMap(s => s.ingredients)
    ];

    // Categorize ingredients (simplified logic)
    allIngredients.forEach(ingredient => {
      const lower = ingredient.toLowerCase();
      if (lower.includes('protein') || lower.includes('chicken') || lower.includes('fish') || lower.includes('tofu')) {
        categories.proteins.push(ingredient);
      } else if (lower.includes('vegetable') || lower.includes('spinach') || lower.includes('tomato')) {
        categories.vegetables.push(ingredient);
      } else if (lower.includes('rice') || lower.includes('grain') || lower.includes('bread')) {
        categories.grains.push(ingredient);
      } else if (lower.includes('spice') || lower.includes('turmeric') || lower.includes('cumin')) {
        categories.spices.push(ingredient);
      } else if (lower.includes('milk') || lower.includes('yogurt') || lower.includes('cheese')) {
        categories.dairy.push(ingredient);
      } else {
        categories.pantry.push(ingredient);
      }
    });

    // Remove duplicates
    Object.keys(categories).forEach(key => {
      const unique: string[] = [];
      categories[key].forEach(item => {
        if (unique.indexOf(item) === -1) {
          unique.push(item);
        }
      });
      categories[key] = unique;
    });

    return categories;
  }

  generateWeeklyShoppingList(days: any[]): Record<string, string[]> {
    const consolidatedList: Record<string, string[]> = {
      proteins: [],
      vegetables: [],
      fruits: [],
      grains: [],
      dairy: [],
      spices: [],
      pantry: []
    };

    days.forEach(day => {
      const dailyList = this.generateShoppingList(day.meals);
      Object.keys(dailyList).forEach(category => {
        if (consolidatedList[category]) {
          consolidatedList[category].push(...dailyList[category]);
        }
      });
    });

    // Remove duplicates
    Object.keys(consolidatedList).forEach(category => {
      const unique: string[] = [];
      consolidatedList[category].forEach(item => {
        if (unique.indexOf(item) === -1) {
          unique.push(item);
        }
      });
      consolidatedList[category] = unique;
    });

    return consolidatedList;
  }

  generateMonthlyShoppingList(weeks: any[]): Record<string, string[]> {
    const monthlyList: Record<string, string[]> = {
      proteins: [],
      vegetables: [],
      fruits: [],
      grains: [],
      dairy: [],
      spices: [],
      pantry: []
    };

    weeks.forEach(week => {
      Object.keys(week.weeklyShoppingList).forEach(category => {
        if (monthlyList[category]) {
          monthlyList[category].push(...week.weeklyShoppingList[category]);
        }
      });
    });

    // Remove duplicates
    Object.keys(monthlyList).forEach(category => {
      const unique: string[] = [];
      monthlyList[category].forEach(item => {
        if (unique.indexOf(item) === -1) {
          unique.push(item);
        }
      });
      monthlyList[category] = unique;
    });

    return monthlyList;
  }
}

export const nutritionistService = new NutritionistService();