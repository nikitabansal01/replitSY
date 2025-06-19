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
  diet: string[];
  symptoms: string[];
  goals: string[];
  lifestyle: Record<string, any>;
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  menstrualCycle: {
    lastPeriodDate: string;
    periodLength: string[];
    length: string[];
    irregularPeriods: boolean;
    symptoms: string[];
  };
  stressLevel: string[];
  sleepHours: string[];
  exerciseLevel: string[];
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
    diet: [],
    symptoms: [],
    goals: [],
    lifestyle: {},
    medicalConditions: [],
    medications: [],
    allergies: [],
    menstrualCycle: {
      lastPeriodDate: '',
      periodLength: [],
      length: [],
      irregularPeriods: false,
      symptoms: []
    },
    stressLevel: [],
    sleepHours: [],
    exerciseLevel: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for "Other" options
  const [otherCondition, setOtherCondition] = useState("");
  const [otherDiet, setOtherDiet] = useState("");
  const [otherExercise, setOtherExercise] = useState("");

  const totalSteps = 10;
  const progressPercentage = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  // Simple NLP for custom entry
  const classifyCondition = (input: string) => {
    const val = input.toLowerCase();
    if (val.includes("thyroid")) return "Hypothyroidism";
    if (val.includes("pcos") || val.includes("pcod")) return "PCOS";
    if (val.includes("endo")) return "Endometriosis";
    return input;
  };

  // Handle other condition changes
  useEffect(() => {
    if (formData.medicalConditions.includes("Other") && otherCondition) {
      const classified = classifyCondition(otherCondition);
      setFormData((prev) => ({
        ...prev,
        medicalConditions: [
          ...prev.medicalConditions.filter((c) => c !== "Other"),
          classified,
        ],
      }));
    }
  }, [otherCondition]);

  // Handle other diet changes
  useEffect(() => {
    if (formData.diet.includes('Other') && otherDiet) {
      setFormData((prev) => ({
        ...prev,
        diet: [...prev.diet.filter((d) => d !== 'Other'), otherDiet],
      }));
    }
  }, [otherDiet]);

  // Handle other exercise changes
  useEffect(() => {
    if (formData.exerciseLevel.includes('Other') && otherExercise) {
      setFormData((prev) => ({
        ...prev,
        exerciseLevel: [...prev.exerciseLevel.filter((e) => e !== 'Other'), otherExercise],
      }));
    }
  }, [otherExercise]);

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
      // Always default to correct structure
      const menstrualCycle = formData.menstrualCycle || { lastPeriodDate: '', periodLength: [], length: [], irregularPeriods: false, symptoms: [] };
      const payload = {
        ...formData,
        diet: Array.isArray(formData.diet) ? formData.diet[0] || '' : formData.diet,
        stressLevel: Array.isArray(formData.stressLevel) ? formData.stressLevel[0] || '' : formData.stressLevel,
        sleepHours: Array.isArray(formData.sleepHours) ? formData.sleepHours[0] || '' : formData.sleepHours,
        exerciseLevel: Array.isArray(formData.exerciseLevel) ? formData.exerciseLevel[0] || '' : formData.exerciseLevel,
        lastPeriodDate: menstrualCycle.lastPeriodDate || '',
        cycleLength: Array.isArray(menstrualCycle.length) ? menstrualCycle.length[0] || '' : menstrualCycle.length || '',
        periodLength: Array.isArray(menstrualCycle.periodLength) ? menstrualCycle.periodLength[0] || '' : menstrualCycle.periodLength || '',
        irregularPeriods: menstrualCycle.irregularPeriods || false,
      } as any;
      if ('menstrualCycle' in payload) delete payload.menstrualCycle;
      const response = await apiRequest('POST', '/api/onboarding', payload);
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
              <label className="block text-sm font-medium mb-3">What's your age range? (Select one)</label>
              <div className="grid grid-cols-2 gap-3">
                {["Below 18", "18-25", "26-35", "36-45", "46-55", "55+"].map((age) => (
                  <Button
                    key={age}
                    variant={formData.age === age ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, age })}
                    className="text-sm"
                  >
                    {age === "Below 18" ? "Below 18" : `${age} years`}
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
            <p className="text-sm text-gray-600 text-center">Have you ever been diagnosed with any of these conditions? (Select all that apply)</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                "PCOS (Polycystic Ovary Syndrome) / PCOD (Polycystic Ovary Disorder)",
                "Endometriosis",
                "Thyroid disorders (Hypo/Hyperthyroidism)",
                "Other"
              ].map((condition) => (
                <div key={condition} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={condition}
                    checked={formData.medicalConditions.includes(condition) || (condition === "Other" && !!otherCondition)}
                    onChange={() => {
                      if (condition === "Other") {
                        if (!formData.medicalConditions.includes("Other")) {
                          setFormData({ ...formData, medicalConditions: [...formData.medicalConditions, "Other"] });
                        }
                      } else {
                        handleArrayToggle('medicalConditions', condition);
                      }
                    }}
                    className="form-checkbox h-5 w-5 text-pink-600"
                  />
                  <label htmlFor={condition} className="text-sm font-medium cursor-pointer flex-1">
                    {condition}
                  </label>
                </div>
              ))}
              {formData.medicalConditions.includes("Other") && (
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
          </div>
        );

      case 4:
        // Map conditions to symptoms
        const conditionSymptomMap: Record<string, string[]> = {
          PCOS: [
            "Irregular periods", "Acne", "Weight gain", "Hair loss", "Ovarian cysts", "Infertility", "Mood swings"
          ],
          Hypothyroidism: [
            "Fatigue", "Weight gain", "Cold sensitivity", "Constipation", "Dry skin", "Hair loss", "Depression"
          ],
          Endometriosis: [
            "Pelvic pain", "Painful periods", "Heavy bleeding", "Pain during intercourse", "Infertility", "Fatigue"
          ],
          default: [
            "Irregular periods", "Heavy bleeding", "Painful periods", "Mood swings", "Weight gain or difficulty losing weight", "Fatigue and low energy", "Hair loss or thinning", "Acne or skin issues", "Bloating and digestive issues", "Food cravings", "Sleep problems", "Stress and anxiety", "Hot flashes", "Brain fog or memory issues", "Joint pain or stiffness"
          ]
        };
        // Determine which symptoms to show
        let symptomOptions: string[] = [];
        if (formData.medicalConditions.some((c) => c.includes("PCOS"))) symptomOptions = conditionSymptomMap.PCOS;
        else if (formData.medicalConditions.some((c) => c.includes("Hypothyroidism"))) symptomOptions = conditionSymptomMap.Hypothyroidism;
        else if (formData.medicalConditions.some((c) => c.includes("Endometriosis"))) symptomOptions = conditionSymptomMap.Endometriosis;
        else if (formData.medicalConditions.length > 0) symptomOptions = conditionSymptomMap.default;
        else symptomOptions = conditionSymptomMap.default;
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Current Symptoms</h2>
            <p className="text-sm text-gray-600 text-center">What symptoms are you currently experiencing? (Select all that apply)</p>
            <div className="grid grid-cols-1 gap-3">
              {symptomOptions.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleArrayToggle('symptoms', symptom)}
                    className="form-checkbox h-5 w-5 text-pink-600"
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
            <h2 className="text-2xl font-bold text-center text-pink-600">Medications</h2>
            <div>
              <label className="block text-sm font-medium mb-3">Are you currently taking any medications? (Select all that apply)</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Birth control pills',
                  'Metformin',
                  'Thyroid medication',
                  'Antidepressants',
                  'Blood pressure medication',
                  'IUI (Intrauterine Insemination)',
                  'IVF (In Vitro Fertilization)',
                  'Hormone replacement therapy',
                  'Other fertility treatments',
                  'None of the above'
                ].map((medication) => (
                  <div key={medication} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={medication}
                      checked={formData.medications.includes(medication)}
                      onChange={() => handleArrayToggle('medications', medication)}
                      className="form-checkbox h-5 w-5 text-pink-600"
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

      /*case 6:
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
        */

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Menstrual Health & Period Tracking</h2>
            <div className="space-y-6">
              {/* Period Tracking Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">When did your last period start?</label>
                  <Input
                    type="date"
                    value={formData.menstrualCycle.lastPeriodDate || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      menstrualCycle: { ...formData.menstrualCycle, lastPeriodDate: e.target.value }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">How many days does your period typically last? (Select all that apply)</label>
                  <div className="grid grid-cols-1 gap-3">
                    {['1-3 days', '4-5 days', '6-7 days', '8+ days', 'Varies'].map((length) => (
                      <div key={length} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={`period-${length}`}
                          checked={formData.menstrualCycle.periodLength.includes(length)}
                          onCheckedChange={() => {
                            const currentLengths = formData.menstrualCycle.periodLength || [];
                            const newLengths = currentLengths.includes(length)
                              ? currentLengths.filter(l => l !== length)
                              : [...currentLengths, length];
                            setFormData({
                              ...formData,
                              menstrualCycle: { ...formData.menstrualCycle, periodLength: newLengths }
                            });
                          }}
                        />
                        <label htmlFor={`period-${length}`} className="text-sm font-medium cursor-pointer flex-1">
                          {length}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Cycle length (Select all that apply)</label>
                  <div className="grid grid-cols-1 gap-3">
                    {['20-25 days', '26-32 days', '33+ days', 'Irregular', 'No periods', 'Post-menopause'].map((length) => (
                      <div key={length} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={`cycle-${length}`}
                          checked={formData.menstrualCycle.length.includes(length)}
                          onCheckedChange={() => {
                            const currentLengths = formData.menstrualCycle.length || [];
                            const newLengths = currentLengths.includes(length)
                              ? currentLengths.filter(l => l !== length)
                              : [...currentLengths, length];
                            setFormData({
                              ...formData,
                              menstrualCycle: { ...formData.menstrualCycle, length: newLengths }
                            });
                          }}
                        />
                        <label htmlFor={`cycle-${length}`} className="text-sm font-medium cursor-pointer flex-1">
                          {length}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Do you experience irregular periods?</label>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="irregularPeriods"
                      checked={formData.menstrualCycle.irregularPeriods}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        menstrualCycle: { ...formData.menstrualCycle, irregularPeriods: checked === true }
                      })}
                    />
                    <label htmlFor="irregularPeriods" className="text-sm cursor-pointer">
                      Yes, my periods are irregular
                    </label>
                  </div>
                </div>
              </div>

              {/* Period Symptoms */}
              <div>
                <label className="block text-sm font-medium mb-3">Period symptoms (Select all that apply)</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Heavy bleeding',
                    'Severe cramps',
                    'PMS symptoms',
                    'Minimal symptoms',
                    'Mood swings',
                    'Bloating',
                    'Breast tenderness',
                    'Headaches',
                    'Fatigue',
                    'Back pain'
                  ].map((symptom) => (
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
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Lifestyle Factors</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">How would you rate your stress level? (Select all that apply)</label>
                <div className="grid grid-cols-1 gap-3">
                  {['Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((level) => (
                    <div key={level} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={level}
                        checked={formData.stressLevel.includes(level)}
                        onCheckedChange={() => handleArrayToggle('stressLevel', level)}
                      />
                      <label htmlFor={level} className="text-sm font-medium cursor-pointer flex-1">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">How many hours of sleep do you get per night? (Select all that apply)</label>
                <div className="grid grid-cols-1 gap-3">
                  {['Less than 6', '6-7 hours', '7-8 hours', '8+ hours'].map((hours) => (
                    <div key={hours} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={hours}
                        checked={formData.sleepHours.includes(hours)}
                        onCheckedChange={() => handleArrayToggle('sleepHours', hours)}
                      />
                      <label htmlFor={hours} className="text-sm font-medium cursor-pointer flex-1">
                        {hours}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Diet Preferences</h2>
            <div className="grid grid-cols-1 gap-3">
              {["Vegetarian", "Vegan", "Pescatarian", "Omnivore", "Other"].map((diet) => (
                <div key={diet} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={diet}
                    checked={formData.diet.includes(diet) || (diet === 'Other' && !!otherDiet)}
                    onChange={() => {
                      if (diet === 'Other') {
                        setFormData({ ...formData, diet: [...formData.diet, 'Other'] });
                      } else {
                        handleArrayToggle('diet', diet);
                      }
                    }}
                    className="form-checkbox h-5 w-5 text-pink-600"
                  />
                  <label htmlFor={diet} className="text-sm font-medium cursor-pointer flex-1">
                    {diet}
                  </label>
                </div>
              ))}
              {formData.diet.includes('Other') && (
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
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-pink-600">Exercise Frequency</h2>
            <div className="grid grid-cols-1 gap-3">
              {['Sedentary', 'Light (1-2x/week)', 'Moderate (3-4x/week)', 'Active (5+ times/week)', 'Other'].map((level) => (
                <div key={level} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={level}
                    checked={formData.exerciseLevel.includes(level) || (level === 'Other' && !!otherExercise)}
                    onChange={() => {
                      if (level === 'Other') {
                        setFormData({ ...formData, exerciseLevel: [...formData.exerciseLevel, 'Other'] });
                      } else {
                        handleArrayToggle('exerciseLevel', level);
                      }
                    }}
                    className="form-checkbox h-5 w-5 text-pink-600"
                  />
                  <label htmlFor={level} className="text-sm font-medium cursor-pointer flex-1">
                    {level}
                  </label>
                </div>
              ))}
              {formData.exerciseLevel.includes('Other') && (
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
                  'Improve thyroid function',
                  'Improve mood and mental health',
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