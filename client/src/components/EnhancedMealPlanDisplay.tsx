import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Heart, ShoppingCart, Utensils, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
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

interface WeeklyMealPlan {
  weeklyPlan: {
    days: Array<{
      dayName: string;
      date: string;
      meals: MealPlan;
    }>;
  };
}

interface EnhancedMealPlanDisplayProps {
  mealPlan: MealPlan | WeeklyMealPlan | any;
  shoppingList?: Record<string, string[]>;
  detectedConditions?: string[];
}

export function EnhancedMealPlanDisplay({ mealPlan, shoppingList, detectedConditions }: EnhancedMealPlanDisplayProps) {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({});
  const [showShoppingList, setShowShoppingList] = useState(false);

  if (!mealPlan) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No meal plan available</p>
        </CardContent>
      </Card>
    );
  }

  const toggleDay = (dayKey: string) => {
    setOpenDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  const toggleMeal = (mealKey: string) => {
    setOpenMeals(prev => ({
      ...prev,
      [mealKey]: !prev[mealKey]
    }));
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return <Utensils className="h-5 w-5 text-amber-600" />;
      case 'lunch':
        return <ChefHat className="h-5 w-5 text-blue-600" />;
      case 'dinner':
        return <Utensils className="h-5 w-5 text-purple-600" />;
      case 'snacks':
        return <Heart className="h-5 w-5 text-green-600" />;
      default:
        return <Utensils className="h-5 w-5 text-gray-600" />;
    }
  };

  const MealDropdown = ({ meal, mealType, dayKey = '' }: { meal: MealItem; mealType: string; dayKey?: string }) => {
    const mealKey = `${dayKey}-${mealType}`;
    const isOpen = openMeals[mealKey];

    return (
      <Card className="mb-3 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/30">
        <Collapsible open={isOpen} onOpenChange={() => toggleMeal(mealKey)}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 rounded-t-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    {getMealIcon(mealType)}
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                      {meal.name}
                    </CardTitle>
                    <CardDescription className="text-sm font-semibold text-primary capitalize mt-1">
                      {mealType} • {meal.cultural_authenticity}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs font-medium px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {meal.preparation_time}
                  </Badge>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-200" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="transition-all duration-300 ease-in-out">
            <CardContent className="pt-0 pb-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200 text-base">
                      <ChefHat className="h-5 w-5 text-orange-500" />
                      Fresh Ingredients
                    </h4>
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                      <ul className="space-y-3">
                        {meal.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-2.5 h-2.5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex-shrink-0"></div>
                            <span className="leading-relaxed font-medium">{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-3 text-gray-800 dark:text-gray-200 text-base">Cooking Method</h4>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {meal.cooking_method}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200 text-base">
                      <Heart className="h-5 w-5 text-red-500" />
                      Health Benefits
                    </h4>
                    <div className="space-y-2">
                      {meal.health_benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-200 border-green-200 dark:border-green-700 font-medium">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-4 text-gray-800 dark:text-gray-200 text-base">Nutritional Focus</h4>
                    <div className="space-y-2">
                      {meal.nutritional_focus.map((focus, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs px-4 py-2 border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 font-medium">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Check if this is a weekly meal plan
  const isWeeklyPlan = mealPlan.weeklyPlan?.days;
  
  if (isWeeklyPlan) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              Weekly Meal Plan
            </CardTitle>
            <CardDescription className="text-base">
              Personalized {mealPlan.weeklyPlan.days[0]?.meals?.cuisine_style || 'nutrition'} meal plan designed for your health goals
            </CardDescription>
          </CardHeader>
        </Card>

        {mealPlan.weeklyPlan.days.map((day: any, dayIdx: number) => {
          const dayKey = `day-${dayIdx}`;
          const isOpen = openDays[dayKey];
          
          return (
            <Card key={dayIdx} className="shadow-lg border-l-4 border-l-primary">
              <Collapsible open={isOpen} onOpenChange={() => toggleDay(dayKey)}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {day.dayName}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-primary">
                          {day.date} • {day.meals?.cuisine_style} Cuisine
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          4 Meals
                        </Badge>
                        {isOpen ? (
                          <ChevronDown className="h-6 w-6 text-primary" />
                        ) : (
                          <ChevronRight className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <MealDropdown meal={day.meals.breakfast} mealType="Breakfast" dayKey={dayKey} />
                      <MealDropdown meal={day.meals.lunch} mealType="Lunch" dayKey={dayKey} />
                      <MealDropdown meal={day.meals.dinner} mealType="Dinner" dayKey={dayKey} />
                      
                      {day.meals.snacks && day.meals.snacks.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Healthy Snacks</h3>
                          {day.meals.snacks.map((snack: MealItem, snackIdx: number) => (
                            <MealDropdown 
                              key={snackIdx} 
                              meal={snack} 
                              mealType={`Snack ${snackIdx + 1}`} 
                              dayKey={dayKey} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {shoppingList && (
          <Card className="mt-6">
            <Collapsible open={showShoppingList} onOpenChange={setShowShoppingList}>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Weekly Shopping List
                    </CardTitle>
                    {showShoppingList ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(shoppingList).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="font-semibold mb-2 capitalize">{category}</h4>
                        <ul className="space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>
    );
  }

  // Single day meal plan
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Daily Meal Plan
          </CardTitle>
          <CardDescription className="text-base">
            Personalized {mealPlan.cuisine_style} nutrition plan for your health goals
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <MealDropdown meal={mealPlan.breakfast} mealType="Breakfast" />
        <MealDropdown meal={mealPlan.lunch} mealType="Lunch" />
        <MealDropdown meal={mealPlan.dinner} mealType="Dinner" />
        
        {mealPlan.snacks && mealPlan.snacks.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Healthy Snacks</h3>
            {mealPlan.snacks.map((snack: MealItem, idx: number) => (
              <MealDropdown key={idx} meal={snack} mealType={`Snack ${idx + 1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}