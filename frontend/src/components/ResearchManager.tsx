import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ResearchStatus {
  success: boolean;
  hasData: boolean;
  sampleResultCount: number;
  message: string;
}

export function ResearchManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);

  // Query to check research database status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<ResearchStatus>({
    queryKey: ['/api/research/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Mutation to initialize research database
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/research/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
      });
      if (!response.ok) throw new Error('Failed to initialize');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Research Database Initialized",
        description: "Comprehensive women's health research has been scraped and stored.",
      });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: error.message || "Failed to initialize research database",
      });
    },
    onMutate: () => {
      setIsInitializing(true);
    },
    onSettled: () => {
      setIsInitializing(false);
    }
  });

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const getStatusColor = () => {
    if (statusLoading) return 'secondary';
    if (!status?.success) return 'destructive';
    return status.hasData ? 'default' : 'secondary';
  };

  const getStatusIcon = () => {
    if (statusLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!status?.success) return <AlertCircle className="h-4 w-4" />;
    return status.hasData ? <CheckCircle className="h-4 w-4" /> : <Database className="h-4 w-4" />;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Research Database Management
        </CardTitle>
        <CardDescription>
          Smart research system for evidence-based women's health recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              {statusLoading ? 'Checking...' : status?.message || 'Unknown status'}
            </Badge>
          </div>
          <Button
            onClick={handleInitialize}
            disabled={isInitializing || initializeMutation.isPending}
            variant={status?.hasData ? "outline" : "default"}
          >
            {isInitializing || initializeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {status?.hasData ? 'Re-initialize Database' : 'Initialize Database'}
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Scrapes research from PubMed, Women's Health, and NIDDK</li>
            <li>Covers PCOS, endometriosis, stress, thyroid, and menstrual health</li>
            <li>Only scrapes new information when knowledge gaps are detected</li>
            <li>Provides evidence-based recommendations in chat responses</li>
          </ul>
          
          {status?.hasData && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ✓ Research database is active with {status.sampleResultCount > 0 ? 'comprehensive' : 'initial'} data.
                Your chatbot will now provide research-backed recommendations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}