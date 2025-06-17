import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Calendar, Clock, Utensils, ShoppingCart, Heart, Sparkles } from 'lucide-react';

interface DailyMealPlannerProps {
  cuisinePreference?: string;
}

interface MealItem {
  name: string;
  ingredients: string[];
  preparation_time: string;
  cooking_method: string;
  nutritional_focus: string[];
  health_benefits: string[];
  cultural_authenticity: string;
}

interface DailyGuidelines {
  foods_to_emphasize: string[];
  foods_to_limit: string[];
  hydration_tips: string[];
  timing_recommendations: string[];
  cycle_support?: string[];
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

interface CheckInResponse {
  message: string;
  followUpQuestions: string[];
  adaptiveRecommendations?: string[];
}

interface FeedbackData {
  date: string;
  followedPlan: boolean;
  enjoyedMeals: string[];
  dislikedMeals: string[];
  energyLevel: number;
  digestiveHealth: number;
  moodRating: number;
  feedback: string;
}

export function DailyMealPlanner({ cuisinePreference = 'balanced' }: DailyMealPlannerProps) {
  const [currentStep, setCurrentStep] = useState<'check-in' | 'meal-plan' | 'feedback'>('check-in');
  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackData>>({});
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check-in query
  const { data: checkInData, isLoading: checkInLoading, error: checkInError } = useQuery({
    queryKey: ['/api/daily/check-in'],
    queryFn: async () => {
      const response = await fetch('/api/daily/check-in', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch check-in data');
      }
      
      return response.json();
    },
    enabled: currentStep === 'check-in'
  }) as { data?: CheckInResponse; isLoading: boolean; error?: Error };

  // Today's meal plan query
  const { data: mealPlanData, isLoading: mealPlanLoading, error: mealPlanError } = useQuery({
    queryKey: ['/api/daily/meal-plan/today'],
    queryFn: async () => {
      const response = await fetch('/api/daily/meal-plan/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch meal plan');
      }
      
      return response.json();
    },
    enabled: currentStep === 'meal-plan'
  }) as { data?: {success: boolean, mealPlan?: TodaysMealPlan}; isLoading: boolean; error?: Error };

  // Generate meal plan mutation
  const generateMealPlan = useMutation({
    mutationFn: async (previousFeedback?: any) => {
      const response = await fetch('/api/daily/meal-plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({ previousFeedback, cuisinePreference })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Meal plan generation error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to generate meal plan');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Meal plan generated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/daily/meal-plan/today'] });
      setCurrentStep('meal-plan');
      toast({
        title: "Meal Plan Ready!",
        description: "Your personalized daily meal plan has been generated."
      });
    },
    onError: (error: Error) => {
      console.error('Meal plan generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate meal plan. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async (feedback: FeedbackData) => {
      const response = await fetch('/api/daily/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      setShowFeedbackForm(false);
      setFeedbackData({});
      toast({
        title: "Feedback Submitted!",
        description: "Thank you! This will help personalize tomorrow's plan."
      });
    }
  });

  const handleGeneratePlan = () => {
    generateMealPlan.mutate(undefined);
  };

  const handleSubmitFeedback = () => {
    const today = new Date().toISOString().split('T')[0];
    const feedback: FeedbackData = {
      date: today,
      followedPlan: feedbackData.followedPlan || false,
      enjoyedMeals: feedbackData.enjoyedMeals || [],
      dislikedMeals: feedbackData.dislikedMeals || [],
      energyLevel: feedbackData.energyLevel || 3,
      digestiveHealth: feedbackData.digestiveHealth || 3,
      moodRating: feedbackData.moodRating || 3,
      feedback: feedbackData.feedback || ''
    };
    submitFeedback.mutate(feedback);
  };

  const MealCard = ({ meal, mealType }: { meal: MealItem; mealType: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const mealIcons = {
      breakfast: '🌅',
      lunch: '☀️', 
      dinner: '🌙',
      snack: '🍎'
    };

    return (
      <Card className="mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mealIcons[mealType as keyof typeof mealIcons] || '🍽️'}</span>
                  <div>
                    <CardTitle className="text-lg">{meal.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {meal.preparation_time} • {meal.cooking_method}
                    </CardDescription>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Ingredients:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.ingredients.map((ingredient, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Nutritional Focus:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.nutritional_focus.map((focus, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    Health Benefits:
                  </Label>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {meal.health_benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const ShoppingListCard = ({ shoppingList }: { shoppingList: Record<string, string[]> }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <CardTitle>Today's Shopping List</CardTitle>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-4">
                {Object.entries(shoppingList).map(([category, items]) => 
                  items.length > 0 ? (
                    <div key={category}>
                      <Label className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}:
                      </Label>
                      <ul className="mt-1 space-y-1">
                        {items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Checkbox className="w-4 h-4" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const FeedbackForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>How was today's meal plan?</CardTitle>
        <CardDescription>
          Your feedback helps us personalize tomorrow's recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Did you follow the meal plan?</Label>
          <RadioGroup 
            value={feedbackData.followedPlan?.toString()} 
            onValueChange={(value) => setFeedbackData(prev => ({ ...prev, followedPlan: value === 'true' }))}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="followed-yes" />
              <Label htmlFor="followed-yes">Yes, mostly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="followed-no" />
              <Label htmlFor="followed-no">No, made changes</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Which meals did you enjoy? (Select all that apply)</Label>
          <div className="mt-2 space-y-2">
            {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
              <div key={meal} className="flex items-center space-x-2">
                <Checkbox 
                  checked={feedbackData.enjoyedMeals?.includes(meal)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFeedbackData(prev => ({ 
                        ...prev, 
                        enjoyedMeals: [...(prev.enjoyedMeals || []), meal] 
                      }));
                    } else {
                      setFeedbackData(prev => ({ 
                        ...prev, 
                        enjoyedMeals: prev.enjoyedMeals?.filter(m => m !== meal) || [] 
                      }));
                    }
                  }}
                />
                <Label className="capitalize">{meal}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Energy Level (1-5)</Label>
          <RadioGroup 
            value={feedbackData.energyLevel?.toString()} 
            onValueChange={(value) => setFeedbackData(prev => ({ ...prev, energyLevel: parseInt(value) }))}
            className="flex gap-4 mt-2"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center space-x-1">
                <RadioGroupItem value={num.toString()} id={`energy-${num}`} />
                <Label htmlFor={`energy-${num}`}>{num}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label>Additional feedback</Label>
          <Textarea 
            placeholder="Tell us about your experience with today's meal plan..."
            value={feedbackData.feedback || ''}
            onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
            className="mt-2"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmitFeedback} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Check-in step
  if (currentStep === 'check-in') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Daily Check-In</h1>
          </div>
          
          {checkInLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ) : checkInError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Error: {checkInError.message}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : checkInData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Welcome to Your Personalized Day
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  {checkInData.message}
                </p>
                
                {checkInData.adaptiveRecommendations && checkInData.adaptiveRecommendations.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <Label className="font-medium text-purple-900 dark:text-purple-100">
                      Today's Adaptations:
                    </Label>
                    <ul className="mt-2 space-y-1">
                      {checkInData.adaptiveRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                          <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={handleGeneratePlan} 
                    disabled={generateMealPlan.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {generateMealPlan.isPending ? 'Creating Your Plan...' : 'Generate Today\'s Meal Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  // Meal plan step
  if (currentStep === 'meal-plan') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Utensils className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold">Today's Meal Plan</h1>
          </div>
          {mealPlanData?.mealPlan?.menstrualPhase && (
            <Badge variant="outline" className="text-sm">
              {mealPlanData.mealPlan.menstrualPhase} Phase
            </Badge>
          )}
        </div>

        {mealPlanLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mealPlanError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">
                Error: {mealPlanError.message}
              </p>
              <Button onClick={() => setCurrentStep('check-in')}>
                Start Over
              </Button>
            </CardContent>
          </Card>
        ) : mealPlanData?.mealPlan ? (
          <div className="space-y-6">
            {/* Personalized message */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardContent className="p-6">
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {mealPlanData.mealPlan.personalizedMessage || 'Your personalized meal plan for today'}
                </p>
                {mealPlanData.mealPlan.adaptations?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Today's Personalizations:</Label>
                    <ul className="space-y-1">
                      {mealPlanData.mealPlan.adaptations.map((adaptation, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                          {adaptation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meals */}
            <div className="space-y-4">
              {mealPlanData.mealPlan.breakfast && (
                <MealCard meal={mealPlanData.mealPlan.breakfast} mealType="breakfast" />
              )}
              {mealPlanData.mealPlan.lunch && (
                <MealCard meal={mealPlanData.mealPlan.lunch} mealType="lunch" />
              )}
              {mealPlanData.mealPlan.dinner && (
                <MealCard meal={mealPlanData.mealPlan.dinner} mealType="dinner" />
              )}
              {mealPlanData.mealPlan.snacks?.map((snack, idx) => (
                <MealCard key={idx} meal={snack} mealType="snack" />
              ))}
            </div>

            {/* Shopping List */}
            {mealPlanData.mealPlan.shoppingList && (
              <ShoppingListCard shoppingList={mealPlanData.mealPlan.shoppingList} />
            )}

            {/* Daily Guidelines */}
            {mealPlanData.mealPlan.dailyGuidelines && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mealPlanData.mealPlan.dailyGuidelines.foods_to_emphasize?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-green-700 dark:text-green-400">
                        Foods to Emphasize:
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mealPlanData.mealPlan.dailyGuidelines.foods_to_emphasize.map((food, idx) => (
                          <Badge key={idx} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {food}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {mealPlanData.mealPlan.dailyGuidelines.hydration_tips?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Hydration Tips:
                      </Label>
                      <ul className="mt-1 space-y-1">
                        {mealPlanData.mealPlan.dailyGuidelines.hydration_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feedback Button */}
            <div className="text-center pt-6">
              {!showFeedbackForm ? (
                <Button 
                  onClick={() => setShowFeedbackForm(true)}
                  variant="outline"
                  size="lg"
                >
                  Share Feedback on Today's Plan
                </Button>
              ) : (
                <FeedbackForm />
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No meal plan found for today. Let's create one!
              </p>
              <Button onClick={() => setCurrentStep('check-in')}>
                Start Daily Check-In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}