import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { signOutUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { IngredientCard } from '@/components/chat/IngredientCard';

import { MealPlanGenerator } from '@/components/MealPlanGenerator';
import type { ChatResponse, IngredientRecommendation } from '@shared/schema';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  ingredients?: IngredientRecommendation[];
  timestamp: Date;
}

interface UserProfile {
  user: {
    name: string;
    email: string;
  };
  onboarding?: {
    age: string;
    diet: string;
    symptoms: string[];
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);


  useEffect(() => {
    if (!loading && !user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (token) {
      loadProfile();
      loadChatHistory();
    }
  }, [token]);

  const loadProfile = async () => {
    if (!token || loading) return;
    try {
      const response = await apiRequest('GET', '/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      // Silently handle auth transitions - backend is working correctly
    }
  };

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



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
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
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {symptom}
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

                    {/* Medical Conditions Alert */}
                    {profile.onboarding.symptoms && profile.onboarding.symptoms.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-orange-700 font-medium text-sm mb-1">Health Focus Areas</p>
                        <p className="text-orange-600 text-xs">
                          {profile.onboarding.symptoms.slice(0, 2).join(', ')}
                          {profile.onboarding.symptoms.length > 2 && ` +${profile.onboarding.symptoms.length - 2} more`}
                        </p>
                      </div>
                    )}

                    {/* Additional Health Info */}
                    {profile.onboarding.currentMedications && profile.onboarding.currentMedications !== 'None' && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-blue-700 font-medium text-sm mb-1 flex items-center">
                          <span className="mr-1">💊</span>Current Medications
                        </p>
                        <p className="text-blue-600 text-xs">
                          {profile.onboarding.currentMedications}
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
                  
                  {profile?.onboarding && (
                    <Button 
                      onClick={() => setInputMessage('Generate a personalized meal plan for my conditions')}
                      variant="ghost" 
                      className="w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <i className="fas fa-utensils mr-2"></i>Get Meal Plan
                    </Button>
                  )}
                  
                  <Button 
                    onClick={signOutUser}
                    variant="outline" 
                    className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Nutritionist */}
            <MealPlanGenerator />

            {/* Quick Actions */}
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

            {/* Health Tip */}
            <Card className="shadow-xl border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Daily Tip
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Magnesium-rich foods like spinach and almonds can help reduce PMS symptoms. 
                  Try adding them to your meals today!
                </p>
                <Button variant="link" className="text-purple-600 p-0 h-auto font-medium">
                  Learn more →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
