import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getAuthToken } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user && !loading) {
      // Force navigation to dashboard after authentication
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
    }
  }, [user, loading, setLocation]);



  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Clear signedOut flag when user actively signs in
      localStorage.removeItem('signedOut');
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Successfully signed in with Google!"
      });
      // Let the App.tsx routing logic handle the redirect based on onboarding status
    } catch (error: any) {
      console.error('Sign in failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Clear signedOut flag when user actively signs in
      localStorage.removeItem('signedOut');
      await signInWithEmail(loginForm.email, loginForm.password);
      toast({
        title: "Success",
        description: "Successfully signed in!"
      });
      // Let the App.tsx routing logic handle the redirect based on onboarding status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const user = await signUpWithEmail(signupForm.email, signupForm.password, signupForm.name);
      // Set a flag to indicate this is a new signup
      localStorage.setItem('isNewSignup', 'true');
      console.log('Signup successful, isNewSignup flag set');
      toast({
        title: "Success",
        description: "Account created successfully!"
      });
      // Let the App.tsx routing logic handle the redirect based on onboarding status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Clear signedOut flag when user actively chooses demo
    localStorage.removeItem('signedOut');
    // Set demo token in localStorage for authentication
    localStorage.setItem('authToken', 'demo-token');
    // Force page reload to ensure auth context picks up the token
    window.location.href = '/onboarding';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
            <i className="fas fa-heart text-white text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meet Winnie</h1>
          <p className="text-lg text-gray-600">Your personal AI health coach for hormonal wellness</p>
        </div>

        {/* Login Card */}
        <Card className="glass-effect border-white/20 shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome!</h2>
                <p className="text-gray-600">Sign in to start your wellness journey</p>
              </div>

              {/* Google Sign In Button */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                variant="outline"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Email/Password Authentication Tabs */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      Sign In with Email
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Demo Mode Button */}
              <Button
                onClick={handleDemoMode}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-base font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <i className="fas fa-play mr-3"></i>
                Try Demo Mode
              </Button>

              <div className="text-center text-sm text-gray-500">
                By continuing, you agree to our Terms & Privacy Policy
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
