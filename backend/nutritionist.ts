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
  },
  acne: {
    name: "Acne (Hormonal/Inflammatory)",
    dietary_focus: ["anti_inflammatory", "glycemic_control", "skin_health"],
    foods_to_include: [
      "zinc_rich_foods", "omega3_fats", "fiber_rich_foods",
      "antioxidant_rich_foods", "probiotic_foods", "vitamin_a_rich_foods",
      "green_tea"
    ],
    foods_to_avoid: [
      "high_glycemic_foods", "dairy_products", "excessive_sugar",
      "processed_foods", "excessive_fats"
    ],
    meal_timing_considerations: [
      "regular_meal_times", "avoid_large_sugar_spikes"
    ]
  },
  iron_deficiency: {
    name: "Iron Deficiency",
    dietary_focus: ["iron_absorption", "vitamin_c_support", "nutrient_density"],
    foods_to_include: [
      "iron_rich_foods", "vitamin_c_foods", "lean_red_meat", "dark_leafy_greens",
      "legumes", "fortified_cereals", "pumpkin_seeds"
    ],
    foods_to_avoid: [
      "calcium_with_iron_meals", "coffee_with_meals", "phytate_rich_foods",
      "excessive_fiber_with_iron"
    ],
    meal_timing_considerations: [
      "take_iron_supplements_empty_stomach", "vitamin_c_with_iron_meals",
      "avoid_calcium_2_hours_before_after_iron"
    ]
  },
  digestive_health: {
    name: "Digestive Health Support",
    dietary_focus: ["gut_health", "fiber_balance", "probiotic_support"],
    foods_to_include: [
      "probiotic_foods", "prebiotic_foods", "fiber_rich_foods",
      "ginger", "peppermint", "bone_broth", "fermented_foods"
    ],
    foods_to_avoid: [
      "processed_foods", "excessive_sugar", "artificial_sweeteners",
      "inflammatory_oils", "excessive_caffeine"
    ],
    meal_timing_considerations: [
      "eat_slowly", "chew_thoroughly", "avoid_large_meals",
      "include_probiotics_daily"
    ]
  },
  hormone_imbalance: {
    name: "Hormone Imbalance",
    dietary_focus: ["hormone_balance", "liver_support", "detoxification"],
    foods_to_include: [
      "cruciferous_vegetables", "omega3_fats", "fiber_rich_foods",
      "antioxidant_rich_foods", "liver_supporting_foods", "adaptogenic_herbs"
    ],
    foods_to_avoid: [
      "processed_foods", "refined_sugars", "excessive_caffeine",
      "alcohol", "inflammatory_oils"
    ],
    meal_timing_considerations: [
      "regular_meal_times", "support_liver_detox", "include_fiber_each_meal"
    ]
  },
  food_sensitivities: {
    name: "Food Sensitivities",
    dietary_focus: ["elimination_diet", "gut_healing", "anti_inflammatory"],
    foods_to_include: [
      "anti_inflammatory_foods", "gut_healing_foods", "easily_digestible_proteins",
      "cooked_vegetables", "bone_broth", "ginger"
    ],
    foods_to_avoid: [
      "common_allergens", "processed_foods", "artificial_additives",
      "excessive_sugar", "inflammatory_oils"
    ],
    meal_timing_considerations: [
      "elimination_diet_approach", "gradual_reintroduction",
      "keep_food_diary", "avoid_trigger_foods"
    ]
  },
  low_activity: {
    name: "Low Activity Level",
    dietary_focus: ["nutrient_density", "metabolism_support", "energy_optimization"],
    foods_to_include: [
      "lean_proteins", "complex_carbs", "healthy_fats", "fiber_rich_foods",
      "vitamin_rich_foods", "mineral_rich_foods"
    ],
    foods_to_avoid: [
      "excessive_calories", "refined_sugars", "processed_foods",
      "excessive_fats", "large_portions"
    ],
    meal_timing_considerations: [
      "smaller_frequent_meals", "protein_with_each_meal",
      "avoid_large_meals", "regular_meal_times"
    ]
  },
  sleep_deprivation: {
    name: "Sleep Deprivation Support",
    dietary_focus: ["sleep_support", "stress_reduction", "circadian_rhythm"],
    foods_to_include: [
      "tryptophan_rich_foods", "magnesium_rich_foods", "calming_herbs",
      "complex_carbs", "healthy_fats", "cherries"
    ],
    foods_to_avoid: [
      "caffeine_after_2pm", "alcohol", "heavy_meals_before_bed",
      "excessive_sugar", "spicy_foods"
    ],
    meal_timing_considerations: [
      "light_dinner_3_hours_before_bed", "include_sleep_supporting_foods",
      "avoid_stimulants_late_day", "regular_meal_times"
    ]
  },
  perimenopause_consideration: {
    name: "Perimenopause Support",
    dietary_focus: ["hormone_balance", "bone_health", "mood_support"],
    foods_to_include: [
      "phytoestrogen_foods", "calcium_rich_foods", "vitamin_d_foods",
      "omega3_fats", "antioxidant_rich_foods", "magnesium_rich_foods"
    ],
    foods_to_avoid: [
      "excessive_caffeine", "alcohol", "refined_sugars",
      "processed_foods", "inflammatory_oils"
    ],
    meal_timing_considerations: [
      "regular_meal_times", "include_phytoestrogens_daily",
      "support_bone_health", "mood_supporting_foods"
    ]
  },
  energy_optimization: {
    name: "Energy Optimization",
    dietary_focus: ["sustained_energy", "blood_sugar_stability", "nutrient_density"],
    foods_to_include: [
      "complex_carbs", "lean_proteins", "healthy_fats", "fiber_rich_foods",
      "b_vitamin_sources", "iron_rich_foods", "antioxidant_rich_foods"
    ],
    foods_to_avoid: [
      "refined_sugars", "processed_foods", "excessive_caffeine",
      "skipping_meals", "large_sugar_spikes"
    ],
    meal_timing_considerations: [
      "protein_with_each_meal", "regular_meal_times", "avoid_skipping_meals",
      "include_complex_carbs"
    ]
  }
};

// Menstrual cycle phase support with seed cycling
export const MENSTRUAL_CYCLE_PHASES = {
  menstrual: {
    name: "Menstrual Phase",
    days: "1-5",
    description: "Rest and renewal - Support iron replenishment and comfort",
    seed_cycling: ["Ground flax seeds (1-2 tbsp daily)", "Raw pumpkin seeds (1 oz daily)"],
    supporting_foods: ["Iron-rich leafy greens", "Warming ginger and turmeric", "Dark chocolate", "Red meat or lentils"],
    benefits: ["Replenish iron stores", "Reduce menstrual cramps", "Support hormone detoxification", "Combat fatigue"],
    lazy_incorporation: ["Sprinkle ground flax on cereal", "Grab handful of pumpkin seeds as snack", "Add flax to store-bought smoothies"],
    tasty_incorporation: ["Chocolate flax energy balls", "Spiced pumpkin seed granola", "Flax banana bread"],
    healthy_incorporation: ["Fresh ground flax daily (store in fridge)", "Soak pumpkin seeds overnight", "Take with vitamin C for iron absorption"]
  },
  follicular: {
    name: "Follicular Phase",
    days: "6-13",
    description: "Energy building - Support estrogen with lignans and healthy fats",
    seed_cycling: ["Ground flax seeds (1-2 tbsp daily)", "Raw pumpkin seeds (1-2 oz daily)"],
    supporting_foods: ["Fresh vegetables", "Lean proteins", "Sprouted foods", "Citrus fruits", "Fermented foods"],
    benefits: ["Support healthy estrogen levels", "Boost energy and mood", "Enhance metabolism", "Improve skin health"],
    lazy_incorporation: ["Buy pre-ground flax from health store", "Keep roasted pumpkin seeds in purse", "Add to existing meals without prep"],
    tasty_incorporation: ["Pumpkin seed pesto pasta", "Flax crusted chicken", "Green goddess salad with pumpkin seeds"],
    healthy_incorporation: ["Grind flax fresh daily for maximum lignans", "Combine with healthy fats", "Track energy improvements"]
  },
  ovulatory: {
    name: "Ovulatory Phase",
    days: "14-16",
    description: "Peak energy - Support ovulation with zinc and vitamin E",
    seed_cycling: ["Raw sesame seeds/tahini (1-2 tbsp daily)", "Raw sunflower seeds (1-2 oz daily)"],
    supporting_foods: ["Antioxidant berries", "Leafy greens", "Avocados", "Wild-caught fish", "Colorful vegetables"],
    benefits: ["Support healthy ovulation", "Maintain peak energy", "Enhance fertility", "Reduce inflammation"],
    lazy_incorporation: ["Tahini on toast or fruit", "Sunflower seed butter as snack", "Pre-made sesame seed bars"],
    tasty_incorporation: ["Sesame crusted salmon", "Tahini chocolate truffles", "Sunflower seed brittle"],
    healthy_incorporation: ["Raw unhulled sesame seeds", "Soak sunflower seeds for digestion", "Combine with zinc-rich foods"]
  },
  luteal: {
    name: "Luteal Phase", 
    days: "17-28",
    description: "Preparation - Support progesterone and reduce PMS symptoms",
    seed_cycling: ["Raw sesame seeds/tahini (1-2 tbsp daily)", "Raw sunflower seeds (1-2 oz daily)"],
    supporting_foods: ["Complex carbs like sweet potato", "Magnesium-rich dark chocolate", "B-vitamin nutritional yeast", "Calming chamomile tea"],
    benefits: ["Support progesterone production", "Reduce PMS and bloating", "Stabilize mood and cravings", "Improve sleep quality"],
    lazy_incorporation: ["Tahini packets for on-the-go", "Sunflower seed trail mix", "Ready-made sesame energy bars"],
    tasty_incorporation: ["Sesame halva for sweet cravings", "Sunflower banana bread", "Tahini date balls"],
    healthy_incorporation: ["Increase seeds to 2 tbsp/2 oz this phase", "Pair with magnesium foods", "Track PMS improvements over 3 months"]
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
      timeout: 45000
    });
    }
    return this.openai;
  }

  // Extract health conditions from comprehensive user profile
  determineMenstrualPhase(userProfile: any): string {
    const lastPeriodDate = userProfile.lastPeriodDate || userProfile.menstrualCycle?.lastPeriodDate;
    const irregularPeriods = userProfile.irregularPeriods;
    const cycleLength = parseInt(userProfile.cycleLength) || parseInt(userProfile.menstrualCycle?.cycleLength) || 28;
    
    console.log('DEBUG: Menstrual phase calculation:', {
      lastPeriodDate,
      irregularPeriods,
      cycleLength,
      hasLastPeriodDate: !!lastPeriodDate
    });
    
    if (!lastPeriodDate || irregularPeriods) {
      // Use lunar cycle for irregular periods or missing data
      console.log('DEBUG: Using lunar cycle due to missing data or irregular periods');
      return this.getLunarCyclePhase();
    }

    const lastPeriod = new Date(lastPeriodDate);
    const today = new Date();
    const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));

    console.log('DEBUG: Date calculations:', {
      lastPeriod: lastPeriod.toISOString(),
      today: today.toISOString(),
      daysSinceLastPeriod
    });

    // If period data is very old (>60 days), use lunar cycle
    if (daysSinceLastPeriod > 60) {
      console.log('DEBUG: Using lunar cycle due to old period data (>60 days)');
      return this.getLunarCyclePhase();
    }

    // Handle case where we're in the current cycle (daysSinceLastPeriod is positive)
    // or if we've passed the cycle length (start of new cycle)
    const currentCycleDay = daysSinceLastPeriod % cycleLength;
    
    // Define phase boundaries based on typical cycle patterns
    const menstrualPhaseEnd = 5; // Days 1-5
    const follicularPhaseEnd = Math.floor(cycleLength * 0.5); // Usually around day 14 for 28-day cycle
    const ovulatoryPhaseEnd = Math.floor(cycleLength * 0.6); // Usually around day 16-17 for 28-day cycle
    
    console.log('DEBUG: Phase boundaries:', {
      currentCycleDay,
      menstrualPhaseEnd,
      follicularPhaseEnd,
      ovulatoryPhaseEnd,
      cycleLength
    });
    
    // Determine phase based on current cycle day
    let phase: string;
    if (currentCycleDay >= 1 && currentCycleDay <= menstrualPhaseEnd) {
      phase = 'menstrual';
    } else if (currentCycleDay > menstrualPhaseEnd && currentCycleDay <= follicularPhaseEnd) {
      phase = 'follicular';
    } else if (currentCycleDay > follicularPhaseEnd && currentCycleDay <= ovulatoryPhaseEnd) {
      phase = 'ovulatory';
    } else {
      phase = 'luteal';
    }
    
    console.log('DEBUG: Determined phase:', phase);
    return phase;
  }

  private getLunarCyclePhase(): string {
    // Calculate lunar phase based on current date
    const today = new Date();
    const lunarMonth = 29.53; // Average lunar month in days
    const knownNewMoon = new Date('2024-01-11'); // Known new moon date
    const daysSinceNewMoon = Math.floor((today.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24));
    const lunarDay = daysSinceNewMoon % lunarMonth;
    
    // Map lunar phases to menstrual phases for women's natural rhythm
    if (lunarDay <= 7) {
      return 'menstrual'; // New moon = menstruation (rest and renewal)
    } else if (lunarDay <= 14) {
      return 'follicular'; // Waxing moon = follicular (energy building)
    } else if (lunarDay <= 21) {
      return 'ovulatory'; // Full moon = ovulation (peak energy)
    } else {
      return 'luteal'; // Waning moon = luteal (preparation and reflection)
    }
  }

  extractHealthConditions(userProfile: any): string[] {
    const conditions: string[] = [];
    const symptoms = userProfile.symptoms || [];
    const medicalConditions = userProfile.medicalConditions || [];
    const goals = userProfile.goals || [];
    const lifestyle = userProfile.lifestyle || {};
    const medications = userProfile.medications || [];
    const allergies = userProfile.allergies || [];
    const exerciseLevel = userProfile.exerciseLevel || '';
    const stressLevel = userProfile.stressLevel || '';
    const sleepHours = userProfile.sleepHours || '';
    const age = userProfile.age || '';

    console.log('DEBUG: Extracting health conditions from profile:', {
      symptoms,
      medicalConditions,
      goals,
      medications,
      allergies,
      exerciseLevel,
      stressLevel,
      sleepHours,
      age
    });

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
      if (lowerCondition.includes('fibroid') || lowerCondition.includes('uterine')) {
        conditions.push('uterine_health');
      }
      if (lowerCondition.includes('migraine') || lowerCondition.includes('headache')) {
        conditions.push('migraine');
      }
    });

    // Enhanced symptom mapping with actual onboarding symptom names
    const symptomMapping: Record<string, string[]> = {
      'irregular_periods': ['pcos'],
      'heavy_bleeding': ['endometriosis', 'pcos', 'uterine_health'],
      'painful_periods': ['endometriosis', 'uterine_health'],
      'weight_gain_or_difficulty_losing_weight': ['pcos', 'thyroid_hypo'],
      'fatigue_and_low_energy': ['thyroid_hypo', 'stress_adrenal', 'iron_deficiency'],
      'mood_swings': ['pcos', 'stress_adrenal', 'hormone_imbalance'],
      'hair_loss_or_thinning': ['pcos', 'thyroid_hypo', 'iron_deficiency'],
      'acne_or_skin_issues': ['acne', 'pcos', 'hormone_imbalance'],
      'bloating_and_digestive_issues': ['digestive_health', 'ibs'],
      'stress_and_anxiety': ['stress_adrenal'],
      'sleep_problems': ['stress_adrenal', 'hormone_imbalance'],
      'food_cravings': ['pcos', 'stress_adrenal', 'blood_sugar_imbalance'],
      'hot_flashes': ['hormone_imbalance', 'perimenopause'],
      'brain_fog_or_memory_issues': ['thyroid_hypo', 'stress_adrenal', 'hormone_imbalance'],
      'joint_pain_or_stiffness': ['autoimmune', 'endometriosis', 'inflammation'],
      'breast_tenderness': ['hormone_imbalance', 'pms'],
      'back_pain': ['endometriosis', 'uterine_health', 'posture_related'],
      'nausea_or_digestive_discomfort': ['digestive_health', 'ibs', 'hormone_imbalance']
    };

    // Check symptoms against conditions
    symptoms.forEach((symptom: string) => {
      const normalizedSymptom = symptom.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
      const mapped = symptomMapping[normalizedSymptom];
      if (mapped) {
        conditions.push(...mapped);
      }
    });

    // Enhanced medication analysis
    medications.forEach((medication: string) => {
      const lowerMed = medication.toLowerCase();
      if (lowerMed.includes('metformin') || lowerMed.includes('glucophage')) {
        conditions.push('pcos', 'insulin_resistance');
      }
      if (lowerMed.includes('levothyroxine') || lowerMed.includes('synthroid') || lowerMed.includes('thyroid')) {
        conditions.push('thyroid_hypo');
      }
      if (lowerMed.includes('birth control') || lowerMed.includes('oral contraceptive')) {
        conditions.push('hormone_regulation');
      }
      if (lowerMed.includes('antidepressant') || lowerMed.includes('ssri') || lowerMed.includes('prozac')) {
        conditions.push('mental_health');
      }
      if (lowerMed.includes('iron') || lowerMed.includes('ferrous')) {
        conditions.push('iron_deficiency');
      }
      if (lowerMed.includes('vitamin d') || lowerMed.includes('d3')) {
        conditions.push('vitamin_d_deficiency');
      }
      if (lowerMed.includes('magnesium')) {
        conditions.push('magnesium_deficiency');
      }
    });

    // Allergy-based condition detection
    if (allergies.length > 0) {
      conditions.push('food_sensitivities');
      
      allergies.forEach((allergy: string) => {
        const lowerAllergy = allergy.toLowerCase();
        if (lowerAllergy.includes('gluten') || lowerAllergy.includes('wheat')) {
          conditions.push('gluten_sensitivity');
        }
        if (lowerAllergy.includes('dairy') || lowerAllergy.includes('lactose')) {
          conditions.push('lactose_intolerance');
        }
        if (lowerAllergy.includes('nuts') || lowerAllergy.includes('peanut')) {
          conditions.push('nut_allergy');
        }
      });
    }

    // Enhanced lifestyle analysis
    if (stressLevel === 'High' || stressLevel === 'Very High') {
      conditions.push('stress_adrenal');
    }

    if (sleepHours === 'Less than 6') {
      conditions.push('stress_adrenal', 'sleep_deprivation');
    }

    if (exerciseLevel === 'Sedentary' || exerciseLevel === 'Light') {
      conditions.push('low_activity');
    }

    // Age-based considerations
    if (age && parseInt(age) >= 40) {
      conditions.push('perimenopause_consideration');
    }

    if (age && parseInt(age) >= 50) {
      conditions.push('menopause_consideration');
    }

    // Enhanced goal analysis
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
      if (lowerGoal.includes('energy') || lowerGoal.includes('vitality')) {
        conditions.push('energy_optimization');
      }
      if (lowerGoal.includes('weight') || lowerGoal.includes('metabolism')) {
        conditions.push('metabolism_support');
      }
      if (lowerGoal.includes('digestive') || lowerGoal.includes('gut')) {
        conditions.push('digestive_health');
      }
      if (lowerGoal.includes('skin') || lowerGoal.includes('acne')) {
        conditions.push('skin_health');
      }
    });

    // Remove duplicates and return
    const uniqueConditions = Array.from(new Set(conditions));
    
    console.log('DEBUG: Extracted health conditions:', uniqueConditions);
    
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
    console.log('DEBUG: generateMealPlan called with:', {
      healthConditions,
      cuisinePreference,
      userProfile,
    });
    const conditions = healthConditions.map(c => HEALTH_CONDITIONS[c]).filter(Boolean);
    const cuisine = CUISINE_PROFILES[cuisinePreference.toLowerCase()] || CUISINE_PROFILES.mediterranean;

    // Determine menstrual cycle phase for phase-specific recommendations
    const currentPhase = this.determineMenstrualPhase(userProfile);
    const phaseData = MENSTRUAL_CYCLE_PHASES[currentPhase as keyof typeof MENSTRUAL_CYCLE_PHASES];
    console.log('DEBUG: Determined menstrual phase:', currentPhase, 'Phase data:', phaseData);

    // Get scientific research data including seed cycling (with timeout for faster response)
    let researchContext = '';
    try {
      const researchQuery = `nutrition diet meal planning ${healthConditions.join(' ')} ${cuisinePreference} seed cycling menstrual cycle ${currentPhase}`;
      // Use a timeout to prevent slow research lookup from blocking meal plan generation
      const researchPromise = researchService.searchWithSmartScraping(researchQuery, 2);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Research timeout')), 5000)
      );
      
      const researchMatches = await Promise.race([researchPromise, timeoutPromise]) as any[];
      if (researchMatches.length > 0) {
        researchContext = `\n\nSCIENTIFIC RESEARCH CONTEXT:\n${researchMatches.map(match => 
          `- ${match.metadata?.title}: ${match.metadata?.content?.substring(0, 200)}...`
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
HORMONE SUPPORT: ${phaseData.supporting_foods.join(', ')}
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

COMPREHENSIVE USER PROFILE:
- Age: ${userProfile.age || 'Not specified'}
- Diet type: ${userProfile.diet || 'omnivore'}
- Medical conditions: ${(userProfile.medicalConditions || []).join(', ') || 'None'}
- Current symptoms: ${(userProfile.symptoms || []).join(', ') || 'None'}
- Medications: ${(userProfile.medications || []).join(', ') || 'None'}
- Food allergies: ${(userProfile.allergies || []).join(', ') || 'None'}
- Exercise level: ${userProfile.exerciseLevel || 'Not specified'}
- Stress level: ${userProfile.stressLevel || 'Not specified'}
- Sleep hours: ${userProfile.sleepHours || 'Not specified'}
- Health goals: ${(userProfile.goals || []).join(', ') || 'General wellness'}
- Height: ${userProfile.height || 'Not specified'}
- Weight: ${userProfile.weight || 'Not specified'}

SPECIAL CONSIDERATIONS:
${userProfile.medications?.length > 0 ? `- MEDICATION INTERACTIONS: Consider interactions with ${userProfile.medications.join(', ')}` : ''}
${userProfile.allergies?.length > 0 ? `- ALLERGY AVOIDANCE: Strictly avoid ${userProfile.allergies.join(', ')}` : ''}
${userProfile.exerciseLevel === 'Sedentary' ? '- LOW ACTIVITY: Focus on nutrient-dense, easy-to-digest foods' : ''}
${userProfile.stressLevel === 'High' || userProfile.stressLevel === 'Very High' ? '- HIGH STRESS: Include stress-reducing foods and adaptogens' : ''}
${userProfile.sleepHours === 'Less than 6' ? '- SLEEP DEPRIVATION: Include sleep-supporting nutrients and avoid stimulants' : ''}

Create a complete daily meal plan that is:
1. Therapeutically appropriate for the health conditions
2. Includes menstrual cycle phase-specific seed cycling recommendations
3. Culturally authentic to ${cuisine.name} cuisine
4. Practical and accessible for the user's lifestyle
5. Nutritionally balanced and personalized
6. Considers medication interactions and food allergies
7. Supports the user's specific health goals
8. Appropriate for their activity level and stress management needs

CRITICAL: Respond with ONLY valid JSON, no markdown formatting, no explanations. Use this exact format:

{"condition_focus":["${healthConditions.join('","')}"],"cuisine_style":"${cuisine.name}","menstrual_phase":"${phaseData.name}","cycle_specific_recommendations":{"phase":"${phaseData.name}","seed_cycling":["${phaseData.seed_cycling.join('","')}"],"hormone_support_foods":["${phaseData.supporting_foods.join('","')}"],"phase_benefits":["${phaseData.benefits.join('","')}"]},"breakfast":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"15 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"lunch":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"20 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"dinner":{"name":"Meal name","ingredients":["ingredient1","ingredient2"],"preparation_time":"25 minutes","cooking_method":"method","nutritional_focus":["focus1","focus2"],"health_benefits":["benefit1","benefit2"],"cultural_authenticity":"explanation"},"snacks":[{"name":"Snack name","ingredients":["ingredient1","ingredient2"],"preparation_time":"5 minutes","cooking_method":"method","nutritional_focus":["focus1"],"health_benefits":["benefit1"],"cultural_authenticity":"explanation"}],"daily_guidelines":{"foods_to_emphasize":["food1","food2"],"foods_to_limit":["food1","food2"],"hydration_tips":["tip1","tip2"],"timing_recommendations":["timing1","timing2"],"cycle_support":["${phaseData.lazy_incorporation.concat(phaseData.tasty_incorporation, phaseData.healthy_incorporation).join('","')}"]}}${researchContext}`;

    try {
      const completion = await Promise.race([
        this.getOpenAI().chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.7,
          max_tokens: 1800,
          response_format: { type: "json_object" },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout')), 20000)
        )
      ]) as any;

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
      console.log('DEBUG: Using fallback meal plan with these params:', {
        healthConditions,
        cuisinePreference,
        userProfile,
      });
      // Return enhanced fallback meal plan instead of throwing error
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

// Lazy singleton pattern
let _nutritionistService: NutritionistService | null = null;

export function getNutritionistService(): NutritionistService {
  if (!_nutritionistService) {
    _nutritionistService = new NutritionistService();
  }
  return _nutritionistService;
}

// For backward compatibility
export const nutritionistService = getNutritionistService();