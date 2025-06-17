import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  MessageSquare, 
  UtensilsCrossed, 
  Activity, 
  Database, 
  Server, 
  TrendingUp,
  Clock,
  Shield,
  LogOut
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalMealPlans: number;
  totalChatMessages: number;
  avgUserSatisfaction: number;
  systemHealth: {
    databaseStatus: string;
    responseTime: number;
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
  };
  userSymptoms: Array<{
    symptoms: string[];
    count: number;
  }>;
  date: string;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  hasOnboarding: boolean;
  lastActivity: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || token !== 'admin-token') {
      setLocation('/admin/login');
      return;
    }
    
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, [setLocation]);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.json();
    }
  });

  const { data: metricsHistory } = useQuery({
    queryKey: ['/api/admin/metrics/history'],
    queryFn: async () => {
      const response = await fetch('/api/admin/metrics/history?days=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.json();
    }
  });

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminUser.username}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active: {metrics?.activeUsers || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalChatMessages || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meal Plans</CardTitle>
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalMealPlans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Generated plans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.avgUserSatisfaction || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    User satisfaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Database</span>
                      <Badge variant={metrics?.systemHealth?.databaseStatus === 'healthy' ? 'default' : 'destructive'}>
                        {metrics?.systemHealth?.databaseStatus || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-medium">{metrics?.systemHealth?.uptime || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-medium">{metrics?.systemHealth?.memoryUsage?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={metrics?.systemHealth?.memoryUsage || 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-medium">{metrics?.systemHealth?.cpuUsage?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={metrics?.systemHealth?.cpuUsage || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Joined</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map((user: AdminUser) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{user.name}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">{formatDate(user.createdAt)}</td>
                            <td className="p-2">
                              <Badge variant={user.hasOnboarding ? 'default' : 'secondary'}>
                                {user.hasOnboarding ? 'Complete' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="p-2">{formatDate(user.lastActivity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Connection Status</span>
                      <Badge variant={metrics?.systemHealth?.databaseStatus === 'healthy' ? 'default' : 'destructive'}>
                        {metrics?.systemHealth?.databaseStatus || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Response Time</span>
                      <span className="font-medium">{metrics?.systemHealth?.responseTime?.toFixed(2) || 0}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Server Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Memory Usage</span>
                        <span>{metrics?.systemHealth?.memoryUsage?.toFixed(1) || 0}%</span>
                      </div>
                      <Progress value={metrics?.systemHealth?.memoryUsage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>CPU Usage</span>
                        <span>{metrics?.systemHealth?.cpuUsage?.toFixed(1) || 0}%</span>
                      </div>
                      <Progress value={metrics?.systemHealth?.cpuUsage || 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics?.activeUsers || 0}</div>
                    <div className="text-sm text-blue-800">Active Users (7 days)</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {((metrics?.activeUsers || 0) / (metrics?.totalUsers || 1) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-800">Engagement Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {((metrics?.totalChatMessages || 0) / (metrics?.totalUsers || 1)).toFixed(1)}
                    </div>
                    <div className="text-sm text-purple-800">Avg Messages per User</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Health Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.userSymptoms && metrics.userSymptoms.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.userSymptoms.map((symptomData, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {Array.isArray(symptomData.symptoms) ? symptomData.symptoms.join(', ') : 'Unknown'}
                        </span>
                        <Badge variant="outline">{symptomData.count} users</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No symptom data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}