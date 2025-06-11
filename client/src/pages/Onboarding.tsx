import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  diet: string;
  symptoms: string[];
  goals: string[];
  lifestyle: Record<string, any>;
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  menstrualCycle: Record<string, any>;
  stressLevel: string;
  sleepHours: string;
  exerciseLevel: string;
  waterIntake: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    age: '',
    diet: '',
    symptoms: [],
    goals: [],
    lifestyle: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 10;
  const progressPercentage = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/onboarding', formData);
      toast({
        title: "Profile Complete!",
        description: "Your health profile has been saved successfully.",
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    const currentSymptoms = formData.symptoms;
    if (currentSymptoms.includes(symptom)) {
      updateFormData('symptoms', currentSymptoms.filter(s => s !== symptom));
    } else {
      updateFormData('symptoms', [...currentSymptoms, symptom]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Health Assessment</h1>
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto p-6">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            
            {/* Question 1: Age Range */}
            {currentStep === 1 && (
              <div className="animate-slide-up">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">What's your age range?</h2>
                <p className="text-gray-600 mb-6">This helps us provide age-appropriate recommendations</p>
                
                <div className="space-y-3">
                  {['18-25', '26-35', '36-45', '46+'].map((age) => (
                    <button
                      key={age}
                      onClick={() => updateFormData('age', age)}
                      className={`option-button ${formData.age === age ? 'selected' : ''}`}
                    >
                      {age} years
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question 2: Primary Symptoms */}
            {currentStep === 2 && (
              <div className="animate-slide-up">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">What symptoms concern you most?</h2>
                <p className="text-gray-600 mb-6">Select all that apply</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['PMS symptoms', 'Irregular periods', 'Painful cramps', 'Mood swings', 'Bloating', 'Fatigue'].map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`option-button ${formData.symptoms.includes(symptom) ? 'selected' : ''} flex items-center`}
                    >
                      <div className={`checkbox-custom mr-3 ${formData.symptoms.includes(symptom) ? 'checked' : ''}`}>
                        {formData.symptoms.includes(symptom) && <i className="fas fa-check text-xs"></i>}
                      </div>
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question 3: Diet Type */}
            {currentStep === 3 && (
              <div className="animate-slide-up">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">How would you describe your diet?</h2>
                <p className="text-gray-600 mb-6">This helps us suggest suitable foods and supplements</p>
                
                <div className="space-y-3">
                  {[
                    { value: 'omnivore', label: 'Omnivore', desc: 'I eat everything including meat and dairy' },
                    { value: 'vegetarian', label: 'Vegetarian', desc: 'I eat dairy and eggs but no meat' },
                    { value: 'vegan', label: 'Vegan', desc: 'I eat only plant-based foods' },
                    { value: 'other', label: 'Other/Mixed', desc: 'I follow a specific diet or have restrictions' }
                  ].map((diet) => (
                    <button
                      key={diet.value}
                      onClick={() => updateFormData('diet', diet.value)}
                      className={`option-button ${formData.diet === diet.value ? 'selected' : ''}`}
                    >
                      <div className="text-lg font-medium">{diet.label}</div>
                      <div className="text-sm text-gray-500">{diet.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder for remaining steps */}
            {currentStep > 3 && currentStep < 10 && (
              <div className="animate-slide-up text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Question {currentStep}</h2>
                <p className="text-gray-600 mb-6">Additional assessment questions would appear here</p>
                <div className="bg-purple-50 rounded-xl p-8">
                  <i className="fas fa-heart text-purple-500 text-4xl mb-4"></i>
                  <p className="text-gray-600">We're gathering information to personalize your experience...</p>
                </div>
              </div>
            )}

            {/* Final step */}
            {currentStep === 10 && (
              <div className="animate-slide-up text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-600 mb-6">Ready to start your personalized health journey with Winnie?</p>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8">
                  <i className="fas fa-sparkles text-purple-500 text-4xl mb-4"></i>
                  <p className="text-gray-700 font-medium">Your profile is complete and ready to provide personalized recommendations!</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                variant="ghost"
                className="text-gray-600"
              >
                <i className="fas fa-arrow-left mr-2"></i>Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={isSubmitting || (currentStep === 1 && !formData.age) || (currentStep === 2 && formData.symptoms.length === 0) || (currentStep === 3 && !formData.diet)}
                className="gradient-bg text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : currentStep === totalSteps ? (
                  <>Complete Setup<i className="fas fa-check ml-2"></i></>
                ) : (
                  <>Next<i className="fas fa-arrow-right ml-2"></i></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
