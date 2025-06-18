import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Database, MessageSquare, Brain, RefreshCw } from 'lucide-react';

interface MetricScore {
  value: number;
  label: string;
  color: string;
}

export default function EvaluationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch comprehensive evaluation report
  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['/api/evaluation/comprehensive-report'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Individual metric queries
  const { data: researchData, refetch: refetchResearch } = useQuery({
    queryKey: ['/api/evaluation/research-quality'],
    enabled: activeTab === 'research'
  });

  const { data: mealPlanData, refetch: refetchMealPlan } = useQuery({
    queryKey: ['/api/evaluation/meal-plan-quality'],
    enabled: activeTab === 'mealplans'
  });

  const { data: adaptiveData, refetch: refetchAdaptive } = useQuery({
    queryKey: ['/api/evaluation/adaptive-responses'],
    enabled: activeTab === 'adaptive'
  });

  const { data: chatbotData, refetch: refetchChatbot } = useQuery({
    queryKey: ['/api/evaluation/chatbot-performance'],
    enabled: activeTab === 'chatbot'
  });

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const ScoreCard = ({ title, score, icon: Icon, description }: {
    title: string;
    score: number;
    icon: any;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <span className={getScoreColor(score)}>{score.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
        <Progress value={score * 10} className="mt-2" />
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );

  const RefreshButton = ({ onRefresh, isLoading }: { onRefresh: () => void; isLoading: boolean }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  if (reportLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const report = reportData?.report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">System Evaluation Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive metrics for scraped data quality and AI performance
            </p>
          </div>
          <RefreshButton onRefresh={refetchReport} isLoading={reportLoading} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="research">Research Data</TabsTrigger>
            <TabsTrigger value="mealplans">Meal Plans</TabsTrigger>
            <TabsTrigger value="adaptive">Adaptive AI</TabsTrigger>
            <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {report && (
              <>
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Overall System Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-6xl font-bold">
                        <span className={getScoreColor(report.overallScore)}>
                          {report.overallScore.toFixed(1)}
                        </span>
                        <span className="text-2xl text-muted-foreground">/10</span>
                      </div>
                      <Badge className={getScoreBadge(report.overallScore)}>
                        {report.overallScore >= 8 ? 'Excellent' : 
                         report.overallScore >= 6 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                      <Progress value={report.overallScore * 10} className="w-full max-w-md mx-auto" />
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <ScoreCard
                    title="Research Quality"
                    score={report.researchQuality.qualityScore}
                    icon={Database}
                    description="Quality of scraped research data"
                  />
                  <ScoreCard
                    title="Meal Plan Quality"
                    score={report.mealPlanQuality.overallQuality}
                    icon={BarChart3}
                    description="Nutritional accuracy and personalization"
                  />
                  <ScoreCard
                    title="Adaptive Responses"
                    score={report.adaptiveResponses.userSatisfactionPredict}
                    icon={Brain}
                    description="Learning from user feedback"
                  />
                  <ScoreCard
                    title="Chatbot Performance"
                    score={(report.chatbotPerformance.responseRelevance + report.chatbotPerformance.scientificAccuracy) / 2}
                    icon={MessageSquare}
                    description="Conversation quality and accuracy"
                  />
                </div>

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Improvement Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="research" className="space-y-6">
            {researchData?.metrics && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Research Data Quality</h2>
                  <RefreshButton onRefresh={refetchResearch} isLoading={false} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Articles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{researchData.metrics.totalArticles}</div>
                      <p className="text-sm text-muted-foreground">Research articles indexed</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Content Length</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Math.round(researchData.metrics.averageContentLength)}</div>
                      <p className="text-sm text-muted-foreground">Characters per article</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Articles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{researchData.metrics.recentArticlesPercentage.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Published within 3 years</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Topic Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(researchData.metrics.topicCoverage).map(([topic, count]) => (
                        <div key={topic} className="flex items-center justify-between">
                          <span className="capitalize">{topic.replace('_', ' ')}</span>
                          <Badge variant="outline">{count} articles</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="mealplans" className="space-y-6">
            {mealPlanData?.metrics && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Meal Plan Quality Analysis</h2>
                  <RefreshButton onRefresh={refetchMealPlan} isLoading={false} />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(mealPlanData.metrics)
                    .filter(([key]) => key !== 'overallQuality')
                    .map(([key, value]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          <span className={getScoreColor(value as number)}>{(value as number).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                        <Progress value={(value as number) * 10} className="mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="adaptive" className="space-y-6">
            {adaptiveData?.metrics && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Adaptive Response Analysis</h2>
                  <RefreshButton onRefresh={refetchAdaptive} isLoading={false} />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(adaptiveData.metrics).map(([key, value]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          <span className={getScoreColor(value as number)}>{(value as number).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                        <Progress value={(value as number) * 10} className="mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="chatbot" className="space-y-6">
            {chatbotData?.metrics && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Chatbot Performance Metrics</h2>
                  <RefreshButton onRefresh={refetchChatbot} isLoading={false} />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(chatbotData.metrics).map(([key, value]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          <span className={getScoreColor(value as number)}>{(value as number).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                        <Progress value={(value as number) * 10} className="mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}