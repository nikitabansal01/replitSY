// Simple PDF generation without external dependency for now
// Will implement full PDF functionality when html-pdf-node is properly configured
import { DailyMealPlan } from './nutritionist';

export interface WeeklyMealPlan {
  week: number;
  days: {
    dayName: string;
    date: string;
    meals: DailyMealPlan;
  }[];
  weeklyShoppingList: Record<string, string[]>;
  weeklyNotes: string[];
}

export interface MonthlyMealPlan {
  month: string;
  year: number;
  weeks: WeeklyMealPlan[];
  monthlyShoppingList: Record<string, string[]>;
  nutritionalSummary: {
    focusAreas: string[];
    keyNutrients: string[];
    healthGoals: string[];
  };
}

class PDFGeneratorService {
  async generateWeeklyMealPlanPDF(
    weeklyPlan: WeeklyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): Promise<Buffer> {
    const html = this.generateWeeklyHTML(weeklyPlan, userProfile, cuisineStyle);
    
    // For now, return HTML as text buffer until PDF library is properly configured
    return Buffer.from(html, 'utf-8');
  }

  async generateMonthlyMealPlanPDF(
    monthlyPlan: MonthlyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): Promise<Buffer> {
    const html = this.generateMonthlyHTML(monthlyPlan, userProfile, cuisineStyle);
    
    // For now, return HTML as text buffer until PDF library is properly configured
    return Buffer.from(html, 'utf-8');
  }

  private generateWeeklyHTML(
    weeklyPlan: WeeklyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Weekly Meal Plan - ${cuisineStyle}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 1.1em;
                opacity: 0.9;
            }
            .user-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
                border-left: 5px solid #667eea;
            }
            .day-section {
                margin-bottom: 40px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .day-header {
                background: #667eea;
                color: white;
                padding: 15px 20px;
                font-size: 1.3em;
                font-weight: 600;
            }
            .day-content {
                padding: 20px;
            }
            .meal {
                margin-bottom: 25px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #28a745;
            }
            .meal-title {
                font-size: 1.2em;
                font-weight: 600;
                color: #28a745;
                margin-bottom: 10px;
            }
            .meal-name {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 8px;
                color: #333;
            }
            .ingredients {
                margin-bottom: 10px;
            }
            .ingredients strong {
                color: #667eea;
            }
            .prep-time, .cooking-method {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 5px;
            }
            .health-benefits {
                background: #e8f5e8;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
                border-left: 3px solid #28a745;
            }
            .shopping-list {
                background: #fff3cd;
                padding: 20px;
                border-radius: 10px;
                margin-top: 30px;
                border-left: 5px solid #ffc107;
            }
            .shopping-category {
                margin-bottom: 15px;
            }
            .shopping-category h4 {
                color: #856404;
                margin-bottom: 8px;
                text-transform: capitalize;
            }
            .shopping-items {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .shopping-item {
                background: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.9em;
                border: 1px solid #ffc107;
            }
            .page-break {
                page-break-before: always;
            }
            .guidelines {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
                border-left: 5px solid #2196f3;
            }
            .guidelines h3 {
                color: #1976d2;
                margin-top: 0;
            }
            .guidelines ul {
                list-style-type: none;
                padding-left: 0;
            }
            .guidelines li {
                padding: 5px 0;
                padding-left: 20px;
                position: relative;
            }
            .guidelines li:before {
                content: "✓";
                color: #4caf50;
                font-weight: bold;
                position: absolute;
                left: 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Weekly ${cuisineStyle} Meal Plan</h1>
            <p>Personalized for ${userProfile?.name || 'Your'} Health Journey</p>
            <p>Generated on ${currentDate}</p>
        </div>

        <div class="user-info">
            <h3>Your Profile Summary</h3>
            <p><strong>Diet Preference:</strong> ${userProfile?.diet || 'Balanced'}</p>
            <p><strong>Health Focus:</strong> ${weeklyPlan.days[0]?.meals?.condition_focus?.join(', ') || 'General Wellness'}</p>
            <p><strong>Cuisine Style:</strong> ${cuisineStyle}</p>
        </div>

        ${weeklyPlan.days.map((day, index) => `
            ${index > 0 ? '<div class="page-break"></div>' : ''}
            <div class="day-section">
                <div class="day-header">
                    ${day.dayName} - ${day.date}
                </div>
                <div class="day-content">
                    <div class="meal">
                        <div class="meal-title">🌅 Breakfast</div>
                        <div class="meal-name">${day.meals.breakfast.name}</div>
                        <div class="ingredients"><strong>Ingredients:</strong> ${day.meals.breakfast.ingredients.join(', ')}</div>
                        <div class="prep-time"><strong>Prep Time:</strong> ${day.meals.breakfast.preparation_time}</div>
                        <div class="cooking-method"><strong>Method:</strong> ${day.meals.breakfast.cooking_method}</div>
                        <div class="health-benefits">
                            <strong>Health Benefits:</strong> ${day.meals.breakfast.health_benefits.join(', ')}
                        </div>
                    </div>

                    <div class="meal">
                        <div class="meal-title">☀️ Lunch</div>
                        <div class="meal-name">${day.meals.lunch.name}</div>
                        <div class="ingredients"><strong>Ingredients:</strong> ${day.meals.lunch.ingredients.join(', ')}</div>
                        <div class="prep-time"><strong>Prep Time:</strong> ${day.meals.lunch.preparation_time}</div>
                        <div class="cooking-method"><strong>Method:</strong> ${day.meals.lunch.cooking_method}</div>
                        <div class="health-benefits">
                            <strong>Health Benefits:</strong> ${day.meals.lunch.health_benefits.join(', ')}
                        </div>
                    </div>

                    <div class="meal">
                        <div class="meal-title">🌙 Dinner</div>
                        <div class="meal-name">${day.meals.dinner.name}</div>
                        <div class="ingredients"><strong>Ingredients:</strong> ${day.meals.dinner.ingredients.join(', ')}</div>
                        <div class="prep-time"><strong>Prep Time:</strong> ${day.meals.dinner.preparation_time}</div>
                        <div class="cooking-method"><strong>Method:</strong> ${day.meals.dinner.cooking_method}</div>
                        <div class="health-benefits">
                            <strong>Health Benefits:</strong> ${day.meals.dinner.health_benefits.join(', ')}
                        </div>
                    </div>

                    ${day.meals.snacks?.length > 0 ? `
                        <div class="meal">
                            <div class="meal-title">🍎 Snacks</div>
                            ${day.meals.snacks.map(snack => `
                                <div style="margin-bottom: 15px;">
                                    <div class="meal-name">${snack.name}</div>
                                    <div class="ingredients"><strong>Ingredients:</strong> ${snack.ingredients.join(', ')}</div>
                                    <div class="prep-time"><strong>Prep Time:</strong> ${snack.preparation_time}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="guidelines">
                        <h3>Daily Guidelines</h3>
                        <ul>
                            ${day.meals.daily_guidelines.foods_to_emphasize.map(food => `<li>Emphasize: ${food}</li>`).join('')}
                            ${day.meals.daily_guidelines.foods_to_limit.map(food => `<li>Limit: ${food}</li>`).join('')}
                            ${day.meals.daily_guidelines.hydration_tips.map(tip => `<li>Hydration: ${tip}</li>`).join('')}
                            ${day.meals.daily_guidelines.timing_recommendations.map(timing => `<li>Timing: ${timing}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('')}

        <div class="page-break"></div>
        <div class="shopping-list">
            <h3>📝 Weekly Shopping List</h3>
            ${Object.entries(weeklyPlan.weeklyShoppingList).map(([category, items]) => `
                <div class="shopping-category">
                    <h4>${category.replace(/_/g, ' ')}</h4>
                    <div class="shopping-items">
                        ${items.map(item => `<span class="shopping-item">${item}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="guidelines">
            <h3>💡 Weekly Success Tips</h3>
            <ul>
                <li>Prep ingredients on Sunday for easier weekday cooking</li>
                <li>Cook grains and proteins in batches</li>
                <li>Keep healthy snacks readily available</li>
                <li>Stay hydrated throughout the day</li>
                <li>Listen to your body's hunger and fullness cues</li>
                <li>Enjoy your meals mindfully without distractions</li>
            </ul>
        </div>
    </body>
    </html>
    `;
  }

  private generateMonthlyHTML(
    monthlyPlan: MonthlyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Monthly Meal Plan - ${monthlyPlan.month} ${monthlyPlan.year}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .summary {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 30px;
                border-left: 5px solid #667eea;
            }
            .week-overview {
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 25px;
                overflow: hidden;
            }
            .week-header {
                background: #28a745;
                color: white;
                padding: 15px 20px;
                font-size: 1.2em;
                font-weight: 600;
            }
            .week-content {
                padding: 20px;
            }
            .day-summary {
                display: grid;
                grid-template-columns: 1fr 2fr 2fr 2fr;
                gap: 10px;
                padding: 10px;
                border-bottom: 1px solid #eee;
                align-items: center;
            }
            .day-summary:last-child {
                border-bottom: none;
            }
            .day-name {
                font-weight: 600;
                color: #667eea;
            }
            .meal-summary {
                font-size: 0.9em;
                color: #666;
            }
            .page-break {
                page-break-before: always;
            }
            .monthly-shopping {
                background: #fff3cd;
                padding: 25px;
                border-radius: 10px;
                margin-top: 30px;
                border-left: 5px solid #ffc107;
            }
            .nutritional-summary {
                background: #e8f5e8;
                padding: 25px;
                border-radius: 10px;
                margin-top: 20px;
                border-left: 5px solid #28a745;
            }
            .focus-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            .focus-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #28a745;
            }
            .shopping-category {
                margin-bottom: 15px;
            }
            .shopping-category h4 {
                color: #856404;
                margin-bottom: 8px;
                text-transform: capitalize;
            }
            .shopping-items {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .shopping-item {
                background: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.85em;
                border: 1px solid #ffc107;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Monthly ${cuisineStyle} Meal Plan</h1>
            <p>${monthlyPlan.month} ${monthlyPlan.year}</p>
            <p>Generated on ${currentDate}</p>
        </div>

        <div class="summary">
            <h3>Monthly Overview</h3>
            <p><strong>Total Weeks:</strong> ${monthlyPlan.weeks.length}</p>
            <p><strong>Cuisine Focus:</strong> ${cuisineStyle}</p>
            <p><strong>Health Goals:</strong> ${monthlyPlan.nutritionalSummary.healthGoals.join(', ')}</p>
        </div>

        <div class="nutritional-summary">
            <h3>🎯 Nutritional Focus Areas</h3>
            <div class="focus-grid">
                <div class="focus-item">
                    <h4>Health Goals</h4>
                    <ul>
                        ${monthlyPlan.nutritionalSummary.healthGoals.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                <div class="focus-item">
                    <h4>Key Nutrients</h4>
                    <ul>
                        ${monthlyPlan.nutritionalSummary.keyNutrients.map(nutrient => `<li>${nutrient}</li>`).join('')}
                    </ul>
                </div>
                <div class="focus-item">
                    <h4>Focus Areas</h4>
                    <ul>
                        ${monthlyPlan.nutritionalSummary.focusAreas.map(area => `<li>${area}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        ${monthlyPlan.weeks.map((week, index) => `
            <div class="week-overview">
                <div class="week-header">
                    Week ${week.week}
                </div>
                <div class="week-content">
                    <div class="day-summary" style="font-weight: 600; background: #f8f9fa;">
                        <div>Day</div>
                        <div>Breakfast</div>
                        <div>Lunch</div>
                        <div>Dinner</div>
                    </div>
                    ${week.days.map(day => `
                        <div class="day-summary">
                            <div class="day-name">${day.dayName}</div>
                            <div class="meal-summary">${day.meals.breakfast.name}</div>
                            <div class="meal-summary">${day.meals.lunch.name}</div>
                            <div class="meal-summary">${day.meals.dinner.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        <div class="page-break"></div>
        <div class="monthly-shopping">
            <h3>🛒 Monthly Shopping Guide</h3>
            <p><em>Organized by food category for efficient shopping</em></p>
            ${Object.entries(monthlyPlan.monthlyShoppingList).map(([category, items]) => `
                <div class="shopping-category">
                    <h4>${category.replace(/_/g, ' ')}</h4>
                    <div class="shopping-items">
                        ${items.map(item => `<span class="shopping-item">${item}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="nutritional-summary">
            <h3>💡 Monthly Success Strategy</h3>
            <ul>
                <li>Plan your weekly shopping trips using the category-organized lists</li>
                <li>Prep ingredients in batches to save time during busy weeks</li>
                <li>Rotate between different ${cuisineStyle} recipes to maintain variety</li>
                <li>Track how different meals make you feel and adjust accordingly</li>
                <li>Stay consistent with meal timing for optimal metabolic health</li>
                <li>Include family and friends in meal preparation for social support</li>
                <li>Remember that small, consistent changes lead to lasting results</li>
            </ul>
        </div>
    </body>
    </html>
    `;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();