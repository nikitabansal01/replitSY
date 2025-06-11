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
  breakfast: MealPlanItem;
  lunch: MealPlanItem;
  dinner: MealPlanItem;
  snacks: MealPlanItem[];
  daily_guidelines: {
    foods_to_emphasize: string[];
    foods_to_limit: string[];
    hydration_tips: string[];
    timing_recommendations: string[];
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

  // Extract health conditions from user profile
  extractHealthConditions(userProfile: any): string[] {
    const conditions: string[] = [];
    const symptoms = userProfile.symptoms || [];
    const goals = userProfile.goals || [];
    const lifestyle = userProfile.lifestyle || {};

    // Map symptoms to conditions
    const symptomMapping: Record<string, string[]> = {
      'irregular_periods': ['pcos'],
      'weight_gain': ['pcos', 'thyroid_hypo'],
      'fatigue': ['thyroid_hypo', 'stress_adrenal'],
      'mood_swings': ['pcos', 'stress_adrenal'],
      'heavy_periods': ['endometriosis'],
      'pelvic_pain': ['endometriosis'],
      'stress': ['stress_adrenal'],
      'anxiety': ['stress_adrenal'],
      'hair_loss': ['pcos', 'thyroid_hypo'],
      'cold_sensitivity': ['thyroid_hypo']
    };

    // Check symptoms against conditions
    symptoms.forEach((symptom: string) => {
      const mapped = symptomMapping[symptom.toLowerCase().replace(/\s+/g, '_')];
      if (mapped) {
        conditions.push(...mapped);
      }
    });

    // Check explicit mentions in goals or lifestyle
    const allText = [...symptoms, ...goals, ...Object.values(lifestyle)]
      .join(' ').toLowerCase();

    if (allText.includes('pcos') || allText.includes('polycystic')) {
      conditions.push('pcos');
    }
    if (allText.includes('endometriosis')) {
      conditions.push('endometriosis');
    }
    if (allText.includes('thyroid') || allText.includes('hypothyroid')) {
      conditions.push('thyroid_hypo');
    }
    if (allText.includes('stress') || allText.includes('adrenal')) {
      conditions.push('stress_adrenal');
    }

    const uniqueConditions: string[] = [];
    conditions.forEach(condition => {
      if (uniqueConditions.indexOf(condition) === -1) {
        uniqueConditions.push(condition);
      }
    });
    return uniqueConditions;
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
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);
      
      const dailyMealPlan = await this.generateMealPlan(healthConditions, cuisinePreference, userProfile);
      
      weeklyPlan.days.push({
        dayName: dayNames[i],
        date: dayDate.toLocaleDateString(),
        meals: dailyMealPlan
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

    // Generate 4 weeks
    for (let week = 1; week <= 4; week++) {
      const weeklyPlan = await this.generateWeeklyMealPlan(healthConditions, cuisinePreference, userProfile);
      weeklyPlan.week = week;
      monthlyPlan.weeks.push(weeklyPlan);
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

    // Get scientific research data for the health conditions
    let researchContext = '';
    try {
      const researchQuery = `nutrition diet meal planning ${healthConditions.join(' ')} ${cuisinePreference}`;
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

    const systemPrompt = `You are an expert nutritionist specializing in women's health conditions. Create a personalized daily meal plan.

HEALTH CONDITIONS: ${healthConditions.join(', ')}
CUISINE PREFERENCE: ${cuisine.name}
DIETARY FOCUS: ${nutritionalFocus.join(', ')}

FOODS TO EMPHASIZE: ${includeIngredients.join(', ')}
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
2. Culturally authentic to ${cuisine.name} cuisine
3. Practical and accessible
4. Nutritionally balanced

CRITICAL: Respond with ONLY valid JSON, no markdown formatting, no explanations. Use this exact format:

{"condition_focus":["${healthConditions.join('","')}"],"cuisine_style":"${cuisine.name}","breakfast":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"15 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"lunch":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"20 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"dinner":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"25 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"snacks":[{"name":"Snack name","ingredients":["ingredient1","ingredient2"],"preparation_time":"5 minutes","cooking_method":"method","nutritional_focus":["focus1"],"health_benefits":["benefit1"],"cultural_authenticity":"explanation"}],"daily_guidelines":{"foods_to_emphasize":["food1","food2"],"foods_to_limit":["food1","food2"],"hydration_tips":["tip1","tip2"],"timing_recommendations":["timing1","timing2"]}}${researchContext}`;

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

      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        return JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Content to parse:', cleanedContent);
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