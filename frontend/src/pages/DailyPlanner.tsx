import { DailyMealPlanner } from '@/components/DailyMealPlanner';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DailyPlanner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Daily Meal Planner Component */}
        <DailyMealPlanner />
      </div>
    </div>
  );
}