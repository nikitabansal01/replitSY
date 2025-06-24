import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User, Heart, Pill, AlertTriangle, Activity } from 'lucide-react';
import type { OnboardingData } from '@shared/schema';

const SYMPTOM_OPTIONS = [
  "Irregular periods",
  "Heavy bleeding", 
  "Painful periods",
  "Weight gain or difficulty losing weight",
  "Fatigue and low energy",
  "Mood swings",
  "Hair loss or thinning",
  "Acne or skin issues",
  "Bloating and digestive issues",
  "Stress and anxiety",
  "Sleep problems",
  "Food cravings",
  "Hot flashes",
  "Brain fog or memory issues"
];

const MEDICAL_CONDITIONS = [
  "PCOS (Polycystic Ovary Syndrome) / PCOD (Polycystic Ovary Disorder)",
  "Endometriosis", 
  "Thyroid disorders (Hypo/Hyperthyroidism)",
  "Other"
];

const DIET_OPTIONS = [
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Pescatarian", label: "Pescatarian" },
  { value: "Omnivore", label: "Omnivore" },
  { value: "Other", label: "Other" }
];

const EXERCISE_OPTIONS = [
  { value: "Sedentary", label: "Sedentary (Little to no exercise)" },
  { value: "Light (1-2x/week)", label: "Light (1-2x/week)" },
  { value: "Moderate (3-4x/week)", label: "Moderate (3-4x/week)" },
  { value: "Active (5+ times/week)", label: "Active (5+ times/week)" },
  { value: "Other", label: "Other" }
];

const STRESS_OPTIONS = [
  { value: "Very Low", label: "Very Low" },
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "High", label: "High" },
  { value: "Very High", label: "Very High" }
];

const SLEEP_OPTIONS = [
  { value: "Less than 6", label: "Less than 6 hours" },
  { value: "6-7 hours", label: "6-7 hours" },
  { value: "7-8 hours", label: "7-8 hours" },
  { value: "8+ hours", label: "8+ hours" }
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  
  // State for "Other" options
  const [otherCondition, setOtherCondition] = useState("");
  const [otherDiet, setOtherDiet] = useState("");
  const [otherExercise, setOtherExercise] = useState("");

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  // Load form data when profile is available
  useEffect(() => {
    if (profile?.onboarding) {
      const onboardingData = profile.onboarding;
      
      // Transform the data to match the profile form structure
      setFormData({
        ...onboardingData,
        // Convert string fields back to arrays for the profile form
        diet: onboardingData.diet ? [onboardingData.diet] : [],
        stressLevel: onboardingData.stressLevel ? [onboardingData.stressLevel] : [],
        sleepHours: onboardingData.sleepHours ? [onboardingData.sleepHours] : [],
        exerciseLevel: onboardingData.exerciseLevel ? [onboardingData.exerciseLevel] : [],
        
        // Ensure arrays are properly handled
        symptoms: Array.isArray(onboardingData.symptoms) ? onboardingData.symptoms : [],
        goals: Array.isArray(onboardingData.goals) ? onboardingData.goals : [],
        medicalConditions: Array.isArray(onboardingData.medicalConditions) ? onboardingData.medicalConditions : [],
        medications: Array.isArray(onboardingData.medications) ? onboardingData.medications : [],
        allergies: Array.isArray(onboardingData.allergies) ? onboardingData.allergies : [],
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.user.id) return;
    setIsSaving(true);
    try {
      // Process "Other" entries before saving
      let processedFormData = { ...formData };
      
      if (formData.medicalConditions?.includes("Other") && otherCondition) {
        processedFormData.medicalConditions = [
          ...(formData.medicalConditions || []).filter(c => c !== "Other"),
          otherCondition
        ];
      }
      
      if (formData.diet?.includes("Other") && otherDiet) {
        processedFormData.diet = otherDiet;
      }
      
      if (formData.exerciseLevel?.includes("Other") && otherExercise) {
        processedFormData.exerciseLevel = otherExercise;
      }

      // Transform data to match database schema
      const payload = {
        ...processedFormData,
        // Convert arrays to single values for database storage
        diet: Array.isArray(processedFormData.diet) ? processedFormData.diet[0] || '' : processedFormData.diet,
        stressLevel: Array.isArray(processedFormData.stressLevel) ? processedFormData.stressLevel[0] || '' : processedFormData.stressLevel,
        sleepHours: Array.isArray(processedFormData.sleepHours) ? processedFormData.sleepHours[0] || '' : processedFormData.sleepHours,
        exerciseLevel: Array.isArray(processedFormData.exerciseLevel) ? processedFormData.exerciseLevel[0] || '' : processedFormData.exerciseLevel,
        
        // Ensure arrays are properly formatted
        symptoms: Array.isArray(processedFormData.symptoms) ? processedFormData.symptoms : [],
        goals: Array.isArray(processedFormData.goals) ? processedFormData.goals : [],
        medicalConditions: Array.isArray(processedFormData.medicalConditions) ? processedFormData.medicalConditions : [],
        medications: Array.isArray(processedFormData.medications) ? processedFormData.medications : [],
        allergies: Array.isArray(processedFormData.allergies) ? processedFormData.allergies : [],
      };

      await updateProfile(payload);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArrayToggle = (field: keyof OnboardingData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData({ ...formData, [field]: newArray });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Failed to load profile data</p>
            <Button onClick={() => setLocation('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Profile Cards */}
        <div className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name"
                    value={profile.user.name} 
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={profile.user.email} 
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age"
                    value={formData.age || ''} 
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="e.g., 28"
                  />
                </div>
                <div>
                  <Label htmlFor="lastPeriodDate">Last Period Date</Label>
                  <Input 
                    id="lastPeriodDate"
                    type="date"
                    value={formData.lastPeriodDate || ''} 
                    onChange={(e) => setFormData({...formData, lastPeriodDate: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for cycle-specific meal planning</p>
                </div>
                <div>
                  <Label htmlFor="cycleLength">Cycle Length (days)</Label>
                  <Input 
                    id="cycleLength"
                    type="number"
                    value={formData.cycleLength || ''} 
                    onChange={(e) => setFormData({...formData, cycleLength: e.target.value})}
                    placeholder="e.g., 28"
                    min="21"
                    max="35"
                  />
                </div>
                <div>
                  <Label htmlFor="periodLength">Period Length (days)</Label>
                  <Input 
                    id="periodLength"
                    type="number"
                    value={formData.periodLength || ''} 
                    onChange={(e) => setFormData({...formData, periodLength: e.target.value})}
                    placeholder="e.g., 5"
                    min="3"
                    max="7"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="irregularPeriods"
                    checked={formData.irregularPeriods || false}
                    onChange={(e) => setFormData({...formData, irregularPeriods: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="irregularPeriods">I have irregular periods</Label>
                  <p className="text-xs text-gray-500">(We'll use lunar cycles for meal planning)</p>
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input 
                    id="height"
                    value={formData.height || ''} 
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    placeholder="e.g., 5 feet 4 inches or 163cm"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input 
                    id="weight"
                    value={formData.weight || ''} 
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="e.g., 140 lbs or 64 kg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diet Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Diet Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="diet">Preferred Diet Style</Label>
                <Select 
                  value={Array.isArray(formData.diet) ? formData.diet[0] || '' : formData.diet || ''} 
                  onValueChange={(value) => {
                    if (value === "Other") {
                      setFormData({...formData, diet: ["Other"]});
                    } else {
                      setFormData({...formData, diet: [value]});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIET_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {Array.isArray(formData.diet) && formData.diet[0] === "Other" && (
                  <div className="mt-2">
                    <Input
                      type="text"
                      placeholder="Please specify your diet preference"
                      value={otherDiet}
                      onChange={(e) => setOtherDiet(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Health Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Health Goals */}
              <div>
                <Label className="text-base font-medium">Health Goals</Label>
                <p className="text-sm text-gray-600 mb-3">What are your primary health goals? (Select all that apply)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Regulate menstrual cycle',
                    'Manage PCOS symptoms',
                    'Improve fertility',
                    'Weight management',
                    'Improve thyroid function',
                    'Improve mood and mental health',
                  ].map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={(formData.goals || []).includes(goal)}
                        onCheckedChange={() => handleArrayToggle('goals', goal)}
                      />
                      <Label htmlFor={`goal-${goal}`} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Current Symptoms */}
              <div>
                <Label className="text-base font-medium">Current Symptoms</Label>
                <p className="text-sm text-gray-600 mb-3">Select all symptoms you're currently experiencing:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SYMPTOM_OPTIONS.map(symptom => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={`symptom-${symptom}`}
                        checked={(formData.symptoms || []).includes(symptom)}
                        onCheckedChange={() => handleArrayToggle('symptoms', symptom)}
                      />
                      <Label htmlFor={`symptom-${symptom}`} className="text-sm">{symptom}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Conditions */}
              <div>
                <Label className="text-base font-medium">Diagnosed Medical Conditions</Label>
                <p className="text-sm text-gray-600 mb-3">Select any conditions you've been diagnosed with:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MEDICAL_CONDITIONS.map(condition => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition}`}
                        checked={(formData.medicalConditions || []).includes(condition) || (condition === "Other" && !!otherCondition)}
                        onCheckedChange={() => {
                          if (condition === "Other") {
                            if (!formData.medicalConditions?.includes("Other")) {
                              setFormData({ ...formData, medicalConditions: [...(formData.medicalConditions || []), "Other"] });
                            } else {
                              setFormData({ ...formData, medicalConditions: (formData.medicalConditions || []).filter(c => c !== "Other") });
                              setOtherCondition("");
                            }
                          } else {
                            handleArrayToggle('medicalConditions', condition);
                          }
                        }}
                      />
                      <Label htmlFor={`condition-${condition}`} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
                {(formData.medicalConditions || []).includes("Other") && (
                  <div className="mt-2">
                    <Input
                      type="text"
                      placeholder="Please specify your condition"
                      value={otherCondition}
                      onChange={(e) => setOtherCondition(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <Label htmlFor="medications" className="text-base font-medium">Current Medications & Supplements</Label>
                <p className="text-sm text-gray-600 mb-2">List any medications or supplements you're taking:</p>
                <Textarea 
                  id="medications"
                  value={(formData.medications || []).join(', ')} 
                  onChange={(e) => setFormData({...formData, medications: e.target.value.split(', ').filter(Boolean)})}
                  placeholder="e.g., Birth control pills, Metformin, Vitamin D, Omega-3"
                  rows={3}
                />
              </div>

              {/* Allergies */}
              <div>
                <Label htmlFor="allergies" className="text-base font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Food Allergies & Restrictions
                </Label>
                <p className="text-sm text-gray-600 mb-2">Important for meal planning - list any allergies or foods to avoid:</p>
                <Textarea 
                  id="allergies"
                  value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : (formData.allergies || '')} 
                  onChange={(e) => setFormData({...formData, allergies: e.target.value.split(', ').filter(Boolean)})}
                  placeholder="e.g., Gluten/Wheat, Dairy, Nuts, Shellfish"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Lifestyle Factors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stressLevel">Stress Level</Label>
                  <Select value={Array.isArray(formData.stressLevel) ? formData.stressLevel[0] || '' : formData.stressLevel || ''} onValueChange={(value) => setFormData({...formData, stressLevel: [value]})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stress level" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRESS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sleepHours">Sleep Hours</Label>
                  <Select value={Array.isArray(formData.sleepHours) ? formData.sleepHours[0] || '' : formData.sleepHours || ''} onValueChange={(value) => setFormData({...formData, sleepHours: [value]})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sleep hours" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLEEP_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="exerciseLevel">Exercise Level</Label>
                  <Select 
                    value={Array.isArray(formData.exerciseLevel) ? formData.exerciseLevel[0] || '' : formData.exerciseLevel || ''} 
                    onValueChange={(value) => {
                      if (value === "Other") {
                        setFormData({...formData, exerciseLevel: ["Other"]});
                      } else {
                        setFormData({...formData, exerciseLevel: [value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXERCISE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {Array.isArray(formData.exerciseLevel) && formData.exerciseLevel[0] === "Other" && (
                    <div className="mt-2">
                      <Input
                        type="text"
                        placeholder="Please specify your exercise frequency"
                        value={otherExercise}
                        onChange={(e) => setOtherExercise(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How Your Data is Used</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-2">
              <p><strong>Storage:</strong> Your data is securely stored in a PostgreSQL database with encryption.</p>
              <p><strong>Meal Planning:</strong> The AI uses your medical conditions, symptoms, allergies, and diet preferences to create personalized meal plans that avoid allergens and support your health goals.</p>
              <p><strong>Health Analysis:</strong> Your symptoms and conditions are mapped to evidence-based nutrition recommendations from medical research.</p>
              <p><strong>Privacy:</strong> Your data is never shared with third parties and is only used to provide personalized health recommendations.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}