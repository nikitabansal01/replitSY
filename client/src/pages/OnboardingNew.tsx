import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function OnboardingNew() {
  const [, setLocation] = useLocation();
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    diet: '',
    symptoms: [],
    goals: [],
    lifestyle: {},
    medicalConditions: [],
    medications: [],
    allergies: [],
    menstrualCycle: {},
    stressLevel: '',
    sleepHours: '',
    exerciseLevel: '',
    waterIntake: ''
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
      const response = await apiRequest('POST', '/api/onboarding', formData);
      
      if (response.ok) {
        toast({
          title: "Profile Complete!",
          description: "Your health profile has been saved successfully.",
        });
        setLocation('/dashboard');
      } else {
        throw new Error('Failed to save onboarding data');
      }
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

  const handleArrayToggle = (field: keyof OnboardingData, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData({ ...formData, [field]: newArray });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-3">What's your age range?</label>
              <div className="grid grid-cols-2 gap-3">
                {['18-25', '26-35', '36-45', '46-55', '55+'].map((age) => (
                  <Button
                    key={age}
                    variant={formData.age === age ? "default" : "outline"}
                    onClick={() => setFormData({...formData, age})}
                    className="text-sm"
                  >
                    {age} years
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Non-binary'].map((gender) => (
                  <Button
                    key={gender}
                    variant={formData.gender === gender ? "default" : "outline"}
                    onClick={() => setFormData({...formData, gender})}
                    className="text-sm"
                  >
                    {gender}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Physical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Height (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., 5'4&quot; or 165cm"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Weight (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., 140 lbs or 65 kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Medical Conditions</h2>
            <p className="text-sm text-gray-600 text-center">Have you ever been diagnosed with any of these conditions?</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                'PCOS (Polycystic Ovary Syndrome)',
                'Endometriosis',
                'Thyroid disorders (Hypo/Hyperthyroidism)',
                'Diabetes (Type 1 or Type 2)',
                'Insulin resistance',
                'High blood pressure',
                'Heart disease',
                'Autoimmune disorders',
                'Depression or anxiety',
                'Eating disorders',
                'Chronic fatigue syndrome',
                'Fibromyalgia',
                'IBS (Irritable Bowel Syndrome)',
                'Celiac disease',
                'Other digestive disorders'
              ].map((condition) => (
                <div key={condition} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={condition}
                    checked={formData.medicalConditions.includes(condition)}
                    onCheckedChange={() => handleArrayToggle('medicalConditions', condition)}
                  />
                  <label htmlFor={condition} className="text-sm font-medium cursor-pointer flex-1">
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Current Symptoms</h2>
            <p className="text-sm text-gray-600 text-center">What symptoms are you currently experiencing?</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Irregular periods',
                'Heavy bleeding',
                'Painful periods',
                'Mood swings',
                'Weight gain or difficulty losing weight',
                'Fatigue and low energy',
                'Hair loss or thinning',
                'Acne or skin issues',
                'Bloating and digestive issues',
                'Food cravings',
                'Sleep problems',
                'Stress and anxiety',
                'Hot flashes',
                'Brain fog or memory issues',
                'Joint pain or stiffness'
              ].map((symptom) => (
                <div key={symptom} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onCheckedChange={() => handleArrayToggle('symptoms', symptom)}
                  />
                  <label htmlFor={symptom} className="text-sm font-medium cursor-pointer flex-1">
                    {symptom}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Medications & Supplements</h2>
            <div>
              <label className="block text-sm font-medium mb-3">Are you currently taking any medications or supplements?</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Birth control pills',
                  'Metformin',
                  'Thyroid medication',
                  'Antidepressants',
                  'Blood pressure medication',
                  'Vitamins (multivitamin, D3, B12)',
                  'Omega-3 supplements',
                  'Probiotics',
                  'Iron supplements',
                  'Magnesium',
                  'Inositol',
                  'Spearmint tea/supplements',
                  'Other herbal supplements',
                  'None of the above'
                ].map((medication) => (
                  <div key={medication} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={medication}
                      checked={formData.medications.includes(medication)}
                      onCheckedChange={() => handleArrayToggle('medications', medication)}
                    />
                    <label htmlFor={medication} className="text-sm font-medium cursor-pointer flex-1">
                      {medication}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Food Allergies & Restrictions</h2>
            <div>
              <label className="block text-sm font-medium mb-3">Do you have any food allergies or dietary restrictions?</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Gluten/Wheat',
                  'Dairy/Lactose',
                  'Nuts (tree nuts, peanuts)',
                  'Soy',
                  'Eggs',
                  'Shellfish',
                  'Fish',
                  'Sesame',
                  'Nightshades (tomatoes, peppers, etc.)',
                  'High histamine foods',
                  'None of the above'
                ].map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={allergy}
                      checked={formData.allergies.includes(allergy)}
                      onCheckedChange={() => handleArrayToggle('allergies', allergy)}
                    />
                    <label htmlFor={allergy} className="text-sm font-medium cursor-pointer flex-1">
                      {allergy}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Menstrual Health</h2>
            {formData.gender === 'Female' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Cycle length (if applicable)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['20-25 days', '26-32 days', '33+ days', 'Irregular', 'No periods', 'Post-menopause'].map((length) => (
                      <Button
                        key={length}
                        variant={formData.menstrualCycle.length === length ? "default" : "outline"}
                        onClick={() => setFormData({
                          ...formData, 
                          menstrualCycle: { ...formData.menstrualCycle, length }
                        })}
                        className="text-sm"
                      >
                        {length}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Period symptoms</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Heavy bleeding', 'Severe cramps', 'PMS symptoms', 'Minimal symptoms'].map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-3">
                        <Checkbox
                          id={symptom}
                          checked={formData.menstrualCycle.symptoms?.includes(symptom)}
                          onCheckedChange={() => {
                            const currentSymptoms = formData.menstrualCycle.symptoms || [];
                            const newSymptoms = currentSymptoms.includes(symptom)
                              ? currentSymptoms.filter((s: string) => s !== symptom)
                              : [...currentSymptoms, symptom];
                            setFormData({
                              ...formData,
                              menstrualCycle: { ...formData.menstrualCycle, symptoms: newSymptoms }
                            });
                          }}
                        />
                        <label htmlFor={symptom} className="text-sm cursor-pointer">
                          {symptom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {formData.gender !== 'Female' && (
              <p className="text-center text-gray-600">This section is not applicable based on your gender selection.</p>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Lifestyle Factors</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">How would you rate your stress level?</label>
                <div className="grid grid-cols-5 gap-2">
                  {['Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((level) => (
                    <Button
                      key={level}
                      variant={formData.stressLevel === level ? "default" : "outline"}
                      onClick={() => setFormData({...formData, stressLevel: level})}
                      className="text-xs"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">How many hours of sleep do you get per night?</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Less than 6', '6-7 hours', '7-8 hours', '8+ hours'].map((hours) => (
                    <Button
                      key={hours}
                      variant={formData.sleepHours === hours ? "default" : "outline"}
                      onClick={() => setFormData({...formData, sleepHours: hours})}
                      className="text-sm"
                    >
                      {hours}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Diet & Exercise</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">What best describes your current diet?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Standard/Balanced',
                    'Mediterranean',
                    'Low-carb/Keto',
                    'Plant-based/Vegetarian',
                    'Vegan',
                    'Paleo',
                    'Anti-inflammatory',
                    'Other/Custom'
                  ].map((diet) => (
                    <Button
                      key={diet}
                      variant={formData.diet === diet ? "default" : "outline"}
                      onClick={() => setFormData({...formData, diet})}
                      className="text-sm"
                    >
                      {diet}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Exercise frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Sedentary', 'Light (1-2x/week)', 'Moderate (3-4x/week)', 'Active (5+ times/week)'].map((level) => (
                    <Button
                      key={level}
                      variant={formData.exerciseLevel === level ? "default" : "outline"}
                      onClick={() => setFormData({...formData, exerciseLevel: level})}
                      className="text-sm"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Health Goals</h2>
            <div>
              <label className="block text-sm font-medium mb-3">What are your primary health goals? (Select all that apply)</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Regulate menstrual cycle',
                  'Manage PCOS symptoms',
                  'Improve fertility',
                  'Weight management',
                  'Increase energy levels',
                  'Reduce inflammation',
                  'Improve mood and mental health',
                  'Better digestion',
                  'Hormone balance',
                  'Reduce stress',
                  'Improve sleep quality',
                  'Strengthen immune system',
                  'Anti-aging and longevity',
                  'Manage chronic conditions'
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={goal}
                      checked={formData.goals.includes(goal)}
                      onCheckedChange={() => handleArrayToggle('goals', goal)}
                    />
                    <label htmlFor={goal} className="text-sm font-medium cursor-pointer flex-1">
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Daily water intake</label>
              <div className="grid grid-cols-4 gap-2">
                {['Less than 4 cups', '4-6 cups', '6-8 cups', '8+ cups'].map((intake) => (
                  <Button
                    key={intake}
                    variant={formData.waterIntake === intake ? "default" : "outline"}
                    onClick={() => setFormData({...formData, waterIntake: intake})}
                    className="text-sm"
                  >
                    {intake}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-pink-600">Health Profile Setup</h1>
                <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {currentStep === totalSteps ? (isSubmitting ? 'Saving...' : 'Complete Profile') : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}