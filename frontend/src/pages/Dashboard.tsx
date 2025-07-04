import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { apiRequest } from '@/lib/queryClient';
import { signOutUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { IngredientCard } from '@/components/chat/IngredientCard';
import { X } from 'lucide-react';

import { MealPlanGenerator } from '@/components/MealPlanGenerator';
import type { ChatResponse, IngredientRecommendation } from '@shared/schema';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  ingredients?: IngredientRecommendation[];
  timestamp: Date;
}

// Daily tips array for frontend rotation
const DAILY_TIPS = [
  {
    tip: "Magnesium-rich foods like spinach and almonds can help reduce PMS symptoms. Try adding them to your meals today!",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5485207/"
  },
  {
    tip: "Flax seeds are rich in lignans and omega-3s, supporting hormone balance during the menstrual cycle.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3074428/"
  },
  {
    tip: "Ginger has anti-inflammatory properties that can help reduce menstrual cramps and nausea.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6341159/"
  },
  {
    tip: "Vitamin D from sunlight or fortified foods supports hormonal balance and immune health.",
    source: "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/"
  },
  {
    tip: "Fermented foods like yogurt and kimchi support gut health, which is linked to hormone regulation.",
    source: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6723657/"
  }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, token, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/');
      return;
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (token) {
      loadChatHistory();
    }
  }, [token]);

  const loadChatHistory = async () => {
    if (!token || loading) return;
    try {
      const response = await apiRequest('GET', '/api/chat/history');
      if (response.ok) {
        const history = await response.json();
        
        const formattedMessages: Message[] = [];
        history.forEach((chat: any) => {
          formattedMessages.push({
            id: `user-${chat.id}`,
            type: 'user',
            content: chat.message,
            timestamp: new Date(chat.createdAt)
          });
          formattedMessages.push({
            id: `ai-${chat.id}`,
            type: 'ai',
            content: chat.response,
            ingredients: chat.ingredients,
            timestamp: new Date(chat.createdAt)
          });
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      // Silently handle auth transitions - backend is working correctly
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !token) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await apiRequest('POST', '/api/chat', {
        message: inputMessage
      });
      const data: ChatResponse = await response.json();

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: data.message,
        ingredients: data.ingredients,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setLocation('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleRemoveSymptom = async (symptomToRemove: string) => {
    if (!profile?.onboarding) return;
    const updatedSymptoms = profile.onboarding.symptoms.filter(s => s !== symptomToRemove);
    
    try {
      await apiRequest('POST', '/api/onboarding', {
        ...profile.onboarding,
        symptoms: updatedSymptoms,
      });
      
      // Profile will be automatically refreshed by ProfileContext
      toast({
        title: "Success",
        description: "Symptom removed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove symptom. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
  const dailyTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Top Navigation */}
      <nav className="glass-effect border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-heart text-white"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Winnie</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hey, {profile?.user.name || 'there'}!
              </span>
              <Button
                onClick={() => setLocation('/profile')}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
              >
                Edit Profile
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl h-[600px] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-heart text-white"></i>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Chat with Winnie</CardTitle>
                    <p className="text-sm text-gray-500">Your AI health coach</p>
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <ChatMessage type="ai">
                    <p className="text-gray-800">
                      Hi {profile?.user.name}! 👋 I'm Winnie, your personal health coach. 
                      {profile?.onboarding && (
                        <>
                          {' '}Based on your profile, I can help you with {profile.onboarding.symptoms.join(', ').toLowerCase()} and provide 
                          {profile.onboarding.diet === 'vegetarian' ? ' vegetarian-friendly' : 
                           profile.onboarding.diet === 'vegan' ? ' vegan' : ''} nutrition recommendations.
                        </>
                      )}
                      {' '}What would you like to know about today?
                    </p>
                  </ChatMessage>
                )}

                {/* Chat Messages */}
                {messages.map((message) => (
                  <ChatMessage key={message.id} type={message.type}>
                    <div className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                      <p className={message.ingredients ? 'mb-4' : ''}>{message.content}</p>
                      
                      {/* Ingredient Cards */}
                      {message.ingredients && message.ingredients.length > 0 && (
                        <div className="space-y-3">
                          {message.ingredients.map((ingredient, index) => (
                            <IngredientCard key={index} ingredient={ingredient} />
                          ))}
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <i className="fas fa-info-circle mr-2"></i>
                              Always consult with your healthcare provider before making significant dietary changes.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ChatMessage>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <ChatMessage type="ai">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </ChatMessage>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about nutrition, symptoms, lifestyle..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="gradient-bg text-white"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>
                
                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    'Create a meal plan for PCOS',
                    'What foods help with bloating?', 
                    'Mediterranean recipes for endometriosis',
                    'How to improve sleep during PMS?',
                    'Indian meal plan for stress management'
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* AI Nutritionist - Personalized Meal Plans below the chatbot */}
            <Card className="shadow-xl rounded-2xl mt-4">
              <CardContent className="p-0">
                <MealPlanGenerator userDiet={profile?.onboarding?.diet || 'balanced'} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Onboarding gentle prompt banner */}
            {profile && !profile.onboarding && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-2 flex items-center justify-between">
                <span className="text-yellow-800 text-sm font-medium">
                  Complete your health profile to unlock personalized insights.
                </span>
                <Button
                  size="sm"
                  className="ml-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                  onClick={() => setLocation('/onboarding')}
                >
                  Complete Profile
                </Button>
              </div>
            )}
            
            {/* Health Dashboard */}
            <Card className="shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">
                      {profile?.user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  Health Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {profile?.onboarding ? (
                  <>
                    {/* Health Status Overview */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <h4 className="font-medium text-purple-900 mb-2">Current Focus Areas</h4>
                      <div className="space-y-2">
                        {profile.onboarding.symptoms && profile.onboarding.symptoms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.onboarding.symptoms.slice(0, 3).map((symptom, idx) => (
                              <span
                                key={idx}
                                className="relative group px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center"
                              >
                                {symptom}
                                <button
                                  aria-label={`Remove ${symptom}`}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500 hover:text-red-500 focus:outline-none"
                                  onClick={() => handleRemoveSymptom(symptom)}
                                  tabIndex={0}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            {profile.onboarding.symptoms.length > 3 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                +{profile.onboarding.symptoms.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-purple-600">Complete your profile to see personalized insights</p>
                        )}
                      </div>
                    </div>

                    {/* Diet & Lifestyle */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-green-600 font-medium">Diet Style</p>
                        <p className="text-green-800 capitalize">{profile.onboarding.diet}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-blue-600 font-medium">Age Group</p>
                        <p className="text-blue-800">{profile.onboarding.age} years</p>
                      </div>
                    </div>

                    {/* Additional Health Info */}
                    {profile.onboarding && typeof (profile.onboarding as any).currentMedications === 'string' && (profile.onboarding as any).currentMedications !== 'None' && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-blue-700 font-medium text-sm mb-1 flex items-center">
                          <span className="mr-1">💊</span>Current Medications
                        </p>
                        <p className="text-blue-600 text-xs">
                          {(profile.onboarding as any).currentMedications}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">Complete your health profile to unlock personalized insights</p>
                    <Button 
                      onClick={() => setLocation('/onboarding')}
                      className="w-full gradient-bg text-white"
                    >
                      Complete Profile
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t">
                  <Button 
                    onClick={() => setLocation('/profile')}
                    variant="outline" 
                    className="w-full text-sm"
                  >
                    <i className="fas fa-edit mr-2"></i>Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {profile?.user.email === 'shrvya.yalaka@gmail.com' && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/daily-planner')}
                  >
                    <i className="fas fa-calendar-check text-purple-500 mr-3"></i>
                    Daily Planner
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/evaluation')}
                  >
                    <i className="fas fa-chart-bar text-blue-500 mr-3"></i>
                    System Metrics
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-utensils text-purple-500 mr-3"></i>
                    Meal Suggestions
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-dumbbell text-purple-500 mr-3"></i>
                    Exercise Plans
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-chart-line text-purple-500 mr-3"></i>
                    Progress Reports
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Health Tip */}
            <Card className="shadow-xl border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Daily Tip
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  {dailyTip.tip}
                </p>
                {/* Only show Learn More for non-demo users or when explicitly enabled */}
                {profile?.user.email !== 'demo@example.com' && (
                  <Button variant="link" className="text-purple-600 p-0 h-auto font-medium" asChild>
                    <a href={dailyTip.source} target="_blank" rel="noopener noreferrer">
                      Learn more →
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
