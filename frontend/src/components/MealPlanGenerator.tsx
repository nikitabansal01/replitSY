import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChefHat, Globe, Sparkles, Calendar, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMealPlanDisplay } from './EnhancedMealPlanDisplay';
import { DailyMealPlanner } from './DailyMealPlanner';

interface CuisineOption {
  id: string;
  name: string;
  description: string;
}

interface MealPlanGeneratorProps {
  userDiet: string;
}

interface MealPlanResponse {
  success: boolean;
  mealPlan: any;
  shoppingList: Record<string, string[]>;
  detectedConditions: string[];
  message: string;
}

const CUISINE_OPTIONS: CuisineOption[] = [
  { id: 'indian', name: 'Indian', description: 'Spice-rich, turmeric-based healing cuisine' },
  { id: 'mediterranean', name: 'Mediterranean', description: 'Anti-inflammatory, omega-3 rich foods' },
  { id: 'japanese', name: 'Japanese', description: 'Fermented foods, seaweed, clean eating' },
  { id: 'mexican', name: 'Mexican', description: 'Bean-rich, antioxidant-packed vegetables' },
  { id: 'american', name: 'American', description: 'Whole foods, lean proteins, fresh produce' }
];

const DURATION_OPTIONS = [
  { id: 'daily', name: '1 Day', description: 'Single day meal plan with recipes' },
  { id: 'weekly', name: '1 Week', description: '7-day meal plan with shopping list' },
  { id: 'monthly', name: '1 Month', description: '4-week comprehensive meal plan' }
];

// Only show 1 Day duration for custom meal plans
const CUSTOM_DURATION_OPTIONS = DURATION_OPTIONS.filter(opt => opt.id === 'daily');

const fadeInAnimation = {
  '@keyframes fadeIn': {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  }
};

const styles = `
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

// Sort cuisines alphabetically for the select dropdown
const SORTED_CUISINE_OPTIONS = [...CUISINE_OPTIONS].sort((a, b) => a.name.localeCompare(b.name));

export function MealPlanGenerator({ userDiet }: MealPlanGeneratorProps) {
  const { toast } = useToast();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [generatedPlan, setGeneratedPlan] = useState<MealPlanResponse | null>(null);

  const generateMealPlan = useMutation({
    mutationFn: async ({ cuisinePreference, duration }: { cuisinePreference: string, duration: string }) => {
      let endpoint = '/api/nutrition/meal-plan';
      if (duration === 'weekly') {
        endpoint = '/api/nutrition/meal-plan/weekly';
      } else if (duration === 'monthly') {
        endpoint = '/api/nutrition/meal-plan/monthly';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({ cuisinePreference })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal plan');
      }
      
      return response.json();
    },
    onSuccess: (data: MealPlanResponse) => {
      setGeneratedPlan(data);
      toast({
        title: "Meal Plan Generated",
        description: `Your personalized ${selectedCuisine} meal plan is ready!`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Could not generate meal plan. Please try again.",
      });
    }
  });

  const downloadPDF = useMutation({
    mutationFn: async ({ cuisinePreference, duration }: { cuisinePreference: string, duration: string }) => {
      let endpoint = '/api/nutrition/meal-plan/weekly/pdf';
      if (duration === 'monthly') {
        endpoint = '/api/nutrition/meal-plan/monthly/pdf';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({ cuisinePreference })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${duration}-meal-plan-${cuisinePreference.toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your meal plan file is downloading now.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGeneratePlan = () => {
    if (!selectedCuisine) {
      toast({
        variant: "destructive",
        title: "Cuisine Required",
        description: "Please select a cuisine preference first.",
      });
      return;
    }

    if (!selectedDuration) {
      toast({
        variant: "destructive",
        title: "Duration Required",
        description: "Please select meal plan duration.",
      });
      return;
    }
    
    generateMealPlan.mutate({ cuisinePreference: selectedCuisine, duration: selectedDuration });
  };

  const handleDownloadPDF = () => {
    if (!selectedCuisine || !selectedDuration) {
      toast({
        title: "Selections Required",
        description: "Choose cuisine and duration before downloading.",
        variant: "destructive"
      });
      return;
    }
    
    downloadPDF.mutate({ cuisinePreference: selectedCuisine, duration: selectedDuration });
  };

  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden">
      {/* Gradient Header inside the card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 pb-4">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <ChefHat className="h-6 w-6 text-purple-600" />
          AI Nutritionist - Personalized Meal Plans
        </div>
        <div className="text-base mt-2 text-gray-700 dark:text-gray-200">
          Get customized meal plans based on your health conditions and cuisine preferences
        </div>
      </div>
      <CardContent className="p-8 pt-4 space-y-8">
        {/* Remove Tab Navigation and always show Custom Meal Plans content */}
        <div className="space-y-8 animate-fade-in">
          {/* Cuisine Selection */}
          <div className="space-y-2">
            <label className="text-lg font-bold text-gray-800 dark:text-gray-100">Choose Your Cuisine Preference</label>
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select a cuisine style" />
              </SelectTrigger>
              <SelectContent>
                {SORTED_CUISINE_OPTIONS.map((cuisine) => (
                  <SelectItem key={cuisine.id} value={cuisine.id}>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium">{cuisine.name}</div>
                        <div className="text-xs text-muted-foreground">{cuisine.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection (only 1 Day) */}
          <div className="space-y-2">
            <label className="text-lg font-bold text-gray-800 dark:text-gray-100">Select Plan Duration</label>
            <div className="grid grid-cols-1 gap-6">
              {CUSTOM_DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration.id}
                  type="button"
                  onClick={() => setSelectedDuration(duration.id)}
                  className={`w-full rounded-xl border transition-all flex flex-col items-center p-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    selectedDuration === duration.id
                      ? 'border-primary bg-primary/5 text-primary shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 text-gray-700 dark:bg-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-2 bg-muted">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="text-base font-semibold mb-1">{duration.name}</div>
                  <div className="text-xs text-muted-foreground text-center leading-tight">
                    {duration.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              onClick={() => generateMealPlan.mutate({ cuisinePreference: selectedCuisine, duration: selectedDuration })}
              disabled={!selectedCuisine || !selectedDuration || generateMealPlan.isPending}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 rounded-xl"
            >
              {generateMealPlan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-6 w-6" />
                  Generate {selectedDuration === 'weekly' ? 'Weekly' : selectedDuration === 'monthly' ? 'Monthly' : 'Daily'} Plan
                </>
              )}
            </Button>
          </div>

          {/* Info Section */}
          <div className="rounded-lg bg-muted/50 p-6 space-y-3 mt-4">
            <p className="text-base font-semibold text-center text-gray-800 dark:text-gray-100">
              Your meal plan will be customized based on:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                Health conditions
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                Dietary preferences
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                Cultural authenticity
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                Nutritional science
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      {/* Display Generated Meal Plan */}
      {generatedPlan && (
        <div className="animate-fade-in">
          <EnhancedMealPlanDisplay 
            mealPlan={generatedPlan.mealPlan}
            shoppingList={generatedPlan.shoppingList}
            detectedConditions={generatedPlan.detectedConditions}
          />
        </div>
      )}
    </Card>
  );
}