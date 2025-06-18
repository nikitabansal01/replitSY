import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Info, Brain, Target, Zap } from 'lucide-react';

interface TrainingMetrics {
  lazy: {
    score: number;
    examples: string[];
    commonIssues: string[];
  };
  tasty: {
    score: number;
    examples: string[];
    commonIssues: string[];
  };
  healthy: {
    score: number;
    examples: string[];
    commonIssues: string[];
  };
}

const TRAINING_EXAMPLES: TrainingMetrics = {
  lazy: {
    score: 85,
    examples: [
      "Take 2 capsules with breakfast daily",
      "Add 1 tsp powder to any drink",
      "Steep tea bags for 5 minutes",
      "Buy pre-washed spinach for instant salads"
    ],
    commonIssues: [
      "Missing specific dosages",
      "Requiring cooking or preparation",
      "Too complex for busy lifestyles"
    ]
  },
  tasty: {
    score: 92,
    examples: [
      "Blend into chocolate-banana smoothies with almond butter",
      "Make golden milk lattes with honey and cinnamon",
      "Add to homemade energy balls with dates and vanilla",
      "Mix into warm oatmeal with berries and maple syrup"
    ],
    commonIssues: [
      "Focusing on medicinal taste",
      "Missing flavor enhancement",
      "Not creative enough"
    ]
  },
  healthy: {
    score: 78,
    examples: [
      "Take 500mg with black pepper for 2000% better absorption",
      "Consume 30 minutes before meals on empty stomach",
      "Take 300-400mg standardized extract (3% rosavins)",
      "Combine with vitamin C foods for iron absorption"
    ],
    commonIssues: [
      "Vague dosage instructions",
      "Missing absorption optimization",
      "No timing guidance"
    ]
  }
};

export function LLMTrainingDashboard() {
  const overallScore = Math.round(
    (TRAINING_EXAMPLES.lazy.score + TRAINING_EXAMPLES.tasty.score + TRAINING_EXAMPLES.healthy.score) / 3
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          LLM Training Performance
        </CardTitle>
        <CardDescription>
          Real-time assessment of implementation method quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </div>
          <p className="text-sm text-muted-foreground">Overall Training Quality</p>
          <Progress value={overallScore} className="mt-2" />
        </div>

        {/* Method Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Lazy Method */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Lazy Method</span>
              </div>
              <Badge variant={getScoreBadge(TRAINING_EXAMPLES.lazy.score)}>
                {TRAINING_EXAMPLES.lazy.score}%
              </Badge>
            </div>
            
            <div className="text-sm space-y-2">
              <div>
                <p className="font-medium text-green-700 mb-1">✓ Good Examples:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.lazy.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-orange-700 mb-1">⚠ Common Issues:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.lazy.commonIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tasty Method */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Tasty Method</span>
              </div>
              <Badge variant={getScoreBadge(TRAINING_EXAMPLES.tasty.score)}>
                {TRAINING_EXAMPLES.tasty.score}%
              </Badge>
            </div>
            
            <div className="text-sm space-y-2">
              <div>
                <p className="font-medium text-green-700 mb-1">✓ Good Examples:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.tasty.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-orange-700 mb-1">⚠ Common Issues:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.tasty.commonIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Healthy Method */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-green-500" />
                <span className="font-medium">Healthy Method</span>
              </div>
              <Badge variant={getScoreBadge(TRAINING_EXAMPLES.healthy.score)}>
                {TRAINING_EXAMPLES.healthy.score}%
              </Badge>
            </div>
            
            <div className="text-sm space-y-2">
              <div>
                <p className="font-medium text-green-700 mb-1">✓ Good Examples:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.healthy.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-orange-700 mb-1">⚠ Common Issues:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {TRAINING_EXAMPLES.healthy.commonIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Training Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Training Guidelines</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Lazy:</strong> Focus on convenience, specific dosages, zero preparation</p>
            <p><strong>Tasty:</strong> Emphasize flavor, creativity, culinary enjoyment</p>
            <p><strong>Healthy:</strong> Include precise dosages, absorption optimization, timing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}