import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Heart, ShoppingCart, Utensils } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface MealItem {
  name: string;
  ingredients: string[];
  preparation_time: string;
  cooking_method: string;
  nutritional_focus: string[];
  health_benefits: string[];
  cultural_authenticity: string;
}

interface MealPlan {
  condition_focus: string[];
  cuisine_style: string;
  menstrual_phase?: string;
  cycle_specific_recommendations?: {
    phase: string;
    seed_cycling: string[];
    hormone_support_foods: string[];
    phase_benefits: string[];
  };
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snacks: MealItem[];
  daily_guidelines: {
    foods_to_emphasize: string[];
    foods_to_limit: string[];
    hydration_tips: string[];
    timing_recommendations: string[];
    cycle_support?: string[];
  };
}

interface MealPlanDisplayProps {
  mealPlan: MealPlan | any;
  shoppingList?: Record<string, string[]>;
  detectedConditions?: string[];
}

export function MealPlanDisplay({ mealPlan, shoppingList, detectedConditions }: MealPlanDisplayProps) {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Handle both daily meal plans and weekly/monthly meal plans
  const displayMealPlan = (mealPlan as any)?.weeklyPlan?.days?.[0]?.meals || (mealPlan as any)?.monthlyPlan?.weeks?.[0]?.days?.[0]?.meals || mealPlan;

  const MealCard = ({ meal, mealType }: { meal: MealItem; mealType: string }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            {meal.name}
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {meal.preparation_time}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {mealType} • {meal.cooking_method}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium text-sm mb-2">Ingredients:</h4>
          <div className="flex flex-wrap gap-1">
            {meal.ingredients.map((ingredient, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {ingredient}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Health Benefits:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {meal.health_benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <Heart className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Nutritional Focus:</h4>
          <div className="flex flex-wrap gap-1">
            {meal.nutritional_focus.map((focus, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {focus.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <ChefHat className="h-3 w-3 inline mr-1" />
            {meal.cultural_authenticity}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Personalized {displayMealPlan.cuisine_style} Meal Plan
          </CardTitle>
          <CardDescription>
            {detectedConditions && detectedConditions.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span>Designed for:</span>
                {detectedConditions.map((condition, idx) => (
                  <Badge key={idx} variant="default">
                    {condition.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Menstrual Cycle Phase Information */}
      {displayMealPlan.cycle_specific_recommendations && (
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-700">
              <Heart className="h-5 w-5" />
              {displayMealPlan.cycle_specific_recommendations.phase} Nutrition
            </CardTitle>
            <CardDescription>
              Tailored recommendations for your current menstrual cycle phase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2 text-pink-700">Seed Cycling for This Phase:</h4>
              <div className="flex flex-wrap gap-2">
                {displayMealPlan.cycle_specific_recommendations.seed_cycling.map((seed: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="border-pink-300 text-pink-700">
                    {seed.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2 text-purple-700">Hormone Support Foods:</h4>
              <div className="flex flex-wrap gap-2">
                {displayMealPlan.cycle_specific_recommendations.hormone_support_foods.map((food: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="border-purple-300 text-purple-700">
                    {food.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Phase Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {displayMealPlan.cycle_specific_recommendations.phase_benefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-pink-500 mr-2">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meals */}
      <div className="grid grid-cols-1 gap-4">
        <MealCard meal={mealPlan.breakfast} mealType="Breakfast" />
        <MealCard meal={mealPlan.lunch} mealType="Lunch" />
        <MealCard meal={mealPlan.dinner} mealType="Dinner" />
        
        {mealPlan.snacks.map((snack: MealItem, idx: number) => (
          <MealCard key={idx} meal={snack} mealType="Snack" />
        ))}
      </div>

      {/* Daily Guidelines */}
      <Collapsible open={showGuidelines} onOpenChange={setShowGuidelines}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Daily Guidelines & Tips</CardTitle>
              <CardDescription>
                Click to view nutritional guidance and meal timing recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 text-green-700">Foods to Emphasize:</h4>
                <div className="flex flex-wrap gap-1">
                  {mealPlan.daily_guidelines.foods_to_emphasize.map((food: string, idx: number) => (
                    <Badge key={idx} variant="default" className="text-xs bg-green-100 text-green-800">
                      {food}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-red-700">Foods to Limit:</h4>
                <div className="flex flex-wrap gap-1">
                  {mealPlan.daily_guidelines.foods_to_limit.map((food: string, idx: number) => (
                    <Badge key={idx} variant="destructive" className="text-xs">
                      {food}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-2">Hydration Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {mealPlan.daily_guidelines.hydration_tips.map((tip: string, idx: number) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Timing Recommendations:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {mealPlan.daily_guidelines.timing_recommendations.map((tip: string, idx: number) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>

              {mealPlan.daily_guidelines.cycle_support && (
                <div>
                  <Separator />
                  <h4 className="font-medium text-sm mb-2 text-pink-700">Seed Cycling & Hormone Support:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {mealPlan.daily_guidelines.cycle_support.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Shopping List */}
      {shoppingList && (
        <Collapsible open={showShoppingList} onOpenChange={setShowShoppingList}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Shopping List
                </CardTitle>
                <CardDescription>
                  Organized by category for easy grocery shopping
                </CardDescription>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(shoppingList).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-2 capitalize">
                          {category.replace(/_/g, ' ')}:
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}