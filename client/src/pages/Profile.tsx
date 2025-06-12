import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User, Heart, Pill, AlertTriangle } from 'lucide-react';
import type { OnboardingData } from '@shared/schema';

interface ProfileData {
  user: {
    id: number;
    name: string;
    email: string;
  };
  onboarding: OnboardingData | null;
}

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
  "Brain fog or memory issues",
  "Joint pain or stiffness"
];

const MEDICAL_CONDITIONS = [
  "PCOS (Polycystic Ovary Syndrome)",
  "Endometriosis", 
  "Thyroid disorders (Hypo/Hyperthyroidism)",
  "Diabetes or insulin resistance",
  "Depression or anxiety disorders",
  "IBS or other digestive disorders",
  "Autoimmune conditions",
  "High blood pressure",
  "High cholesterol",
  "None of the above"
];

const DIET_OPTIONS = [
  { value: "Mediterranean", label: "Mediterranean" },
  { value: "Indian", label: "Indian" },
  { value: "Japanese", label: "Japanese" },
  { value: "Mexican", label: "Mexican" },
  { value: "American", label: "American" },
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Keto", label: "Keto" },
  { value: "Paleo", label: "Paleo" }
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
    
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        if (data.onboarding) {
          setFormData(data.onboarding);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData?.user.id) return;
    
    setIsSaving(true);
    try {
      const response = await apiRequest('POST', '/api/onboarding', {
        ...formData,
        userId: profileData.user.id
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
        await fetchProfileData(); // Refresh data
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update profile. Please try again.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profileData) {
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
                    value={profileData.user.name} 
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={profileData.user.email} 
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
            <CardContent>
              <Label htmlFor="diet">Preferred Diet Style</Label>
              <Select value={formData.diet || ''} onValueChange={(value) => setFormData({...formData, diet: value})}>
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
                        checked={(formData.medicalConditions || []).includes(condition)}
                        onCheckedChange={() => handleArrayToggle('medicalConditions', condition)}
                      />
                      <Label htmlFor={`condition-${condition}`} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
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
                  <Select value={formData.stressLevel || ''} onValueChange={(value) => setFormData({...formData, stressLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stress level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sleepHours">Sleep Hours</Label>
                  <Select value={formData.sleepHours || ''} onValueChange={(value) => setFormData({...formData, sleepHours: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sleep hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 6">Less than 6 hours</SelectItem>
                      <SelectItem value="6-7 hours">6-7 hours</SelectItem>
                      <SelectItem value="7-8 hours">7-8 hours</SelectItem>
                      <SelectItem value="8+ hours">8+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="exerciseLevel">Exercise Level</Label>
                  <Select value={formData.exerciseLevel || ''} onValueChange={(value) => setFormData({...formData, exerciseLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedentary">Sedentary (Little to no exercise)</SelectItem>
                      <SelectItem value="Light">Light (1-2x/week)</SelectItem>
                      <SelectItem value="Moderate">Moderate (3-4x/week)</SelectItem>
                      <SelectItem value="Active">Active (5-6x/week)</SelectItem>
                      <SelectItem value="Very Active">Very Active (Daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="waterIntake">Daily Water Intake</Label>
                  <Select value={formData.waterIntake || ''} onValueChange={(value) => setFormData({...formData, waterIntake: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select water intake" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 4 cups">Less than 4 cups</SelectItem>
                      <SelectItem value="4-6 cups">4-6 cups</SelectItem>
                      <SelectItem value="6-8 cups">6-8 cups</SelectItem>
                      <SelectItem value="8+ cups">8+ cups</SelectItem>
                    </SelectContent>
                  </Select>
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