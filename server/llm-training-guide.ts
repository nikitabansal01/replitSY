// Comprehensive training guide for LLM responses
// This defines the exact meaning and examples for each implementation method

export interface ImplementationMethod {
  name: 'lazy' | 'tasty' | 'healthy';
  definition: string;
  characteristics: string[];
  examples: string[];
  avoidPatterns: string[];
}

export const IMPLEMENTATION_METHODS: Record<string, ImplementationMethod> = {
  lazy: {
    name: 'lazy',
    definition: 'The quickest, most convenient method requiring minimal preparation, time, or effort',
    characteristics: [
      'Pre-packaged or ready-made options',
      'No cooking or complex preparation required',
      'Grab-and-go convenience',
      'Minimal ingredients or steps',
      'Can be done while multitasking',
      'Standardized dosages (capsules, tablets)',
      'Available at most stores'
    ],
    examples: [
      'Take 2 capsules with breakfast daily',
      'Add 1 tsp powder to any drink or smoothie',
      'Buy pre-washed baby spinach for instant salads',
      'Steep tea bags for 5 minutes',
      'Grab a handful of raw nuts as snack',
      'Choose liquid supplements with dropper'
    ],
    avoidPatterns: [
      'Complex recipes',
      'Multiple preparation steps',
      'Cooking or baking required',
      'Hard-to-find ingredients',
      'Time-consuming methods'
    ]
  },

  tasty: {
    name: 'tasty',
    definition: 'The most enjoyable, flavorful preparation that maximizes taste pleasure and culinary satisfaction',
    characteristics: [
      'Focus on flavor, texture, and enjoyment',
      'Creative culinary applications',
      'Masks bitter or unpleasant tastes',
      'Enhances natural flavors',
      'Makes healthy ingredients feel like treats',
      'Appeals to taste preferences',
      'Social and sharing-friendly'
    ],
    examples: [
      'Blend into chocolate-banana smoothies with almond butter',
      'Make golden milk lattes with turmeric, honey, and cinnamon',
      'Add to homemade energy balls with dates and vanilla',
      'Mix into warm oatmeal with berries and maple syrup',
      'Create herbal tea blends with ginger and lemon',
      'Incorporate into baked goods or desserts'
    ],
    avoidPatterns: [
      'Plain or flavorless preparations',
      'Clinical or medicinal descriptions',
      'Bitter or unpalatable methods',
      'Boring or repetitive suggestions'
    ]
  },

  healthy: {
    name: 'healthy',
    definition: 'The nutritionally optimal method that maximizes therapeutic benefits, bioavailability, and efficacy',
    characteristics: [
      'Preserves maximum nutrients and bioactive compounds',
      'Optimizes absorption and bioavailability',
      'Considers proper timing and dosage',
      'Includes synergistic combinations',
      'Avoids nutrient-blocking interactions',
      'Evidence-based protocols',
      'Therapeutic dosing ranges'
    ],
    examples: [
      'Take 500mg with black pepper for 2000% better absorption',
      'Consume on empty stomach 30 minutes before meals',
      'Combine with vitamin C-rich foods for iron absorption',
      'Take with healthy fats for fat-soluble vitamin uptake',
      'Use standardized extract (3% rosavins, 1% salidroside)',
      'Cycle 8 weeks on, 2 weeks off for adaptogenic herbs'
    ],
    avoidPatterns: [
      'Vague dosing instructions',
      'Ignoring absorption factors',
      'Missing timing considerations',
      'Generic "follow package directions"'
    ]
  }
};

export const QUALITY_VALIDATION_CRITERIA = {
  lazy: {
    requiredElements: ['specific dosage or amount', 'convenience factor', 'minimal effort'],
    forbiddenElements: ['complex preparation', 'multiple steps', 'cooking required'],
    keyWords: ['capsule', 'powder', 'tea bag', 'pre-made', 'ready', 'instant', 'grab']
  },
  tasty: {
    requiredElements: ['flavor enhancement', 'enjoyable preparation', 'taste appeal'],
    forbiddenElements: ['bitter', 'unpalatable', 'medicinal taste'],
    keyWords: ['blend', 'smooth', 'honey', 'chocolate', 'latte', 'delicious', 'sweet']
  },
  healthy: {
    requiredElements: ['specific dosage', 'absorption optimization', 'timing guidance'],
    forbiddenElements: ['vague instructions', 'generic advice'],
    keyWords: ['mg', 'IU', 'standardized', 'bioavailability', 'absorption', 'empty stomach', 'with meals']
  }
};

// Function to validate ingredient recommendations
export function validateImplementationMethods(ingredient: any): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check if all three methods are present
  if (!ingredient.lazy || !ingredient.tasty || !ingredient.healthy) {
    errors.push('Missing required implementation methods (lazy, tasty, or healthy)');
  }

  // Validate lazy method
  if (ingredient.lazy) {
    const criteria = QUALITY_VALIDATION_CRITERIA.lazy;
    if (!criteria.keyWords.some(word => ingredient.lazy.toLowerCase().includes(word))) {
      suggestions.push('Lazy method should include convenience-focused terms like "capsule", "powder", or "pre-made"');
    }
    if (ingredient.lazy.toLowerCase().includes('cook') || ingredient.lazy.toLowerCase().includes('recipe')) {
      errors.push('Lazy method should not require cooking or complex recipes');
    }
  }

  // Validate tasty method
  if (ingredient.tasty) {
    const criteria = QUALITY_VALIDATION_CRITERIA.tasty;
    if (!criteria.keyWords.some(word => ingredient.tasty.toLowerCase().includes(word))) {
      suggestions.push('Tasty method should include flavor-enhancing terms like "blend", "honey", or "latte"');
    }
    if (ingredient.tasty.toLowerCase().includes('bitter') || ingredient.tasty.toLowerCase().includes('unpalatable')) {
      errors.push('Tasty method should focus on pleasant flavors, not bitter or unpalatable preparations');
    }
  }

  // Validate healthy method
  if (ingredient.healthy) {
    const criteria = QUALITY_VALIDATION_CRITERIA.healthy;
    const hasDosage = /\d+\s*(mg|mcg|g|iu|ml)/i.test(ingredient.healthy);
    if (!hasDosage) {
      suggestions.push('Healthy method should include specific dosages (mg, mcg, g, IU, ml)');
    }
    if (!criteria.keyWords.some(word => ingredient.healthy.toLowerCase().includes(word))) {
      suggestions.push('Healthy method should include optimization terms like "absorption", "bioavailability", or timing guidance');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}

// Enhanced prompt section for better training
export const ENHANCED_TRAINING_PROMPT = `
CRITICAL: Each ingredient must have three distinct implementation methods that serve different user needs:

🔹 LAZY METHOD - For busy people who want convenience:
   • Use pre-packaged options (capsules, powders, ready-made)
   • Require NO cooking or complex preparation
   • Include specific, easy dosages
   • Examples: "Take 2 capsules with breakfast", "Add 1 tsp powder to any drink"

🔸 TASTY METHOD - For people who want to enjoy their health routine:
   • Focus on flavor, texture, and culinary pleasure
   • Make it feel like a treat, not medicine
   • Use creative recipes and combinations
   • Examples: "Blend into chocolate smoothies with banana", "Make golden milk lattes with honey"

🔹 HEALTHY METHOD - For people who want maximum therapeutic benefit:
   • Include specific dosages with units (mg, mcg, g, IU)
   • Mention absorption enhancers or timing
   • Provide evidence-based protocols
   • Examples: "Take 500mg with black pepper for better absorption", "Consume 30 minutes before meals"

Each method should be 15-25 words and provide actionable, specific guidance.
`;