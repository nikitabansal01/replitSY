import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChefHat, Globe, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMealPlanDisplay } from './EnhancedMealPlanDisplay';

interface CuisineOption {
  id: string;
  name: string;
  description: string;
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

export function MealPlanGenerator() {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            AI Nutritionist - Personalized Meal Plans
          </CardTitle>
          <CardDescription>
            Get customized meal plans based on your health conditions and cuisine preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Cuisine Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose Your Cuisine Preference</label>
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cuisine style" />
              </SelectTrigger>
              <SelectContent>
                {CUISINE_OPTIONS.map((cuisine) => (
                  <SelectItem key={cuisine.id} value={cuisine.id}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
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

          {/* Duration Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose Meal Plan Duration</label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((duration) => (
                  <SelectItem key={duration.id} value={duration.id}>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{duration.name}</div>
                        <div className="text-xs text-muted-foreground">{duration.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cuisine Preview */}
          {selectedCuisine && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {CUISINE_OPTIONS.find(c => c.id === selectedCuisine)?.name} Cuisine
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {CUISINE_OPTIONS.find(c => c.id === selectedCuisine)?.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGeneratePlan}
              disabled={!selectedCuisine || !selectedDuration || generateMealPlan.isPending}
              className="w-full"
              size="lg"
            >
              {generateMealPlan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Your Personalized Plan...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Generate Meal Plan
                </>
              )}
            </Button>

            {(selectedDuration === 'weekly' || selectedDuration === 'monthly') && (
              <Button
                onClick={handleDownloadPDF}
                disabled={!selectedCuisine || !selectedDuration || downloadPDF.isPending}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {downloadPDF.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Download...
                  </>
                ) : (
                  <>
                    📄 Download {selectedDuration === 'weekly' ? '1-Week' : '1-Month'} Plan PDF
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Your meal plan will be customized based on:</p>
            <div className="flex flex-wrap justify-center gap-1">
              <Badge variant="outline" className="text-xs">Health conditions</Badge>
              <Badge variant="outline" className="text-xs">Dietary preferences</Badge>
              <Badge variant="outline" className="text-xs">Cultural authenticity</Badge>
              <Badge variant="outline" className="text-xs">Nutritional science</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Generated Meal Plan */}
      {generatedPlan && (
        <EnhancedMealPlanDisplay 
          mealPlan={generatedPlan.mealPlan}
          shoppingList={generatedPlan.shoppingList}
          detectedConditions={generatedPlan.detectedConditions}
        />
      )}
    </div>
  );
}