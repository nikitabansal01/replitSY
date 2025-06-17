import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/admin/login', credentials);
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        
        toast({
          title: "Success",
          description: "Admin login successful"
        });

        setLocation('/admin/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid admin credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Admin Access
            </CardTitle>
            <p className="text-slate-300">System administration panel</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400 text-center">
                Demo credentials: admin / admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}