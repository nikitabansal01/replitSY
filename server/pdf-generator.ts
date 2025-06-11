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
    const puppeteer = require('puppeteer');
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      const html = this.generateWeeklyHTML(weeklyPlan, userProfile, cuisineStyle);
      
      await page.setContent(html);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });
      
      await browser.close();
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      // Fallback to HTML buffer
      const html = this.generateWeeklyHTML(weeklyPlan, userProfile, cuisineStyle);
      return Buffer.from(html, 'utf-8');
    }
  }

  async generateMonthlyMealPlanPDF(
    monthlyPlan: MonthlyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): Promise<Buffer> {
    const html = this.generateMonthlyHTML(monthlyPlan, userProfile, cuisineStyle);
    return Buffer.from(html, 'utf-8');
  }

  private generateWeeklyHTML(
    weeklyPlan: WeeklyMealPlan,
    userProfile: any,
    cuisineStyle: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Meal Plan - Women's Health Nutrition</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #2d3748;
      background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #ec4899, #be185d);
      color: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 300;
      letter-spacing: 2px;
    }
    
    .header .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      font-style: italic;
    }
    
    .wellness-quote {
      text-align: center;
      font-style: italic;
      color: #be185d;
      margin: 30px 0;
      font-size: 1.1rem;
      padding: 20px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 15px;
      border-left: 5px solid #ec4899;
    }
    
    .day-card {
      background: white;
      margin-bottom: 40px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 2px solid #fce7f3;
    }
    
    .day-header {
      background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
      padding: 20px 30px;
      border-bottom: 3px solid #ec4899;
    }
    
    .day-header h2 {
      color: #581c87;
      font-size: 1.8rem;
      margin-bottom: 5px;
    }
    
    .day-header .date {
      color: #7c3aed;
      font-size: 1.1rem;
    }
    
    .meals-container {
      padding: 30px;
    }
    
    .meal-section {
      margin-bottom: 35px;
      padding: 25px;
      background: linear-gradient(135deg, #fdf4ff, #fef7ff);
      border-radius: 15px;
      border-left: 5px solid #ec4899;
    }
    
    .meal-title {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      font-size: 1.4rem;
      color: #be185d;
      font-weight: 600;
    }
    
    .meal-emoji {
      font-size: 1.8rem;
      margin-right: 15px;
    }
    
    .meal-name {
      font-size: 1.2rem;
      color: #374151;
      margin-bottom: 15px;
      font-weight: 500;
    }
    
    .meal-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }
    
    .detail-box {
      background: white;
      padding: 15px;
      border-radius: 10px;
      border: 1px solid #fce7f3;
    }
    
    .detail-label {
      font-weight: 600;
      color: #be185d;
      margin-bottom: 8px;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .ingredients-list {
      list-style: none;
      padding: 0;
    }
    
    .ingredients-list li {
      padding: 5px 0;
      border-bottom: 1px solid #fce7f3;
      color: #4b5563;
    }
    
    .ingredients-list li:last-child {
      border-bottom: none;
    }
    
    .ingredients-list li:before {
      content: "🌿";
      margin-right: 8px;
    }
    
    .prep-time {
      background: #fef3c7;
      color: #92400e;
      padding: 8px 15px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      display: inline-block;
    }
    
    .health-benefits {
      background: #ecfdf5;
      border: 1px solid #86efac;
      border-radius: 10px;
      padding: 15px;
      margin-top: 15px;
    }
    
    .health-benefits h4 {
      color: #166534;
      margin-bottom: 10px;
      font-size: 1rem;
    }
    
    .benefits-list {
      color: #166534;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .snacks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .snack-card {
      background: white;
      border: 2px solid #fce7f3;
      border-radius: 12px;
      padding: 20px;
    }
    
    .shopping-list {
      background: white;
      border-radius: 20px;
      padding: 40px;
      margin-top: 50px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 3px solid #ec4899;
    }
    
    .shopping-header {
      text-align: center;
      margin-bottom: 30px;
      color: #be185d;
      font-size: 2rem;
    }
    
    .category-section {
      margin-bottom: 30px;
      background: linear-gradient(135deg, #fef7ff, #fdf4ff);
      border-radius: 15px;
      padding: 25px;
      border-left: 5px solid #ec4899;
    }
    
    .category-title {
      color: #be185d;
      font-size: 1.3rem;
      margin-bottom: 15px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .category-items {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    
    .category-items li {
      background: white;
      padding: 10px 15px;
      border-radius: 8px;
      border: 1px solid #fce7f3;
      color: #374151;
      font-weight: 500;
    }
    
    .category-items li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .footer-note {
      text-align: center;
      margin-top: 40px;
      padding: 25px;
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border-radius: 15px;
      color: #be185d;
      font-style: italic;
      border: 2px solid #ec4899;
    }
    
    @media print {
      body { background: white; }
      .container { max-width: none; margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌸 Weekly ${cuisineStyle} Meal Plan</h1>
      <div class="subtitle">Personalized Nutrition for Women's Wellness</div>
    </div>
    
    <div class="wellness-quote">
      "Nourish your body with intention, fuel your life with purpose, and embrace the journey to optimal health."
    </div>
    
    ${weeklyPlan.days.map(day => `
      <div class="day-card">
        <div class="day-header">
          <h2>${day.dayName}</h2>
          <div class="date">${day.date}</div>
        </div>
        
        <div class="meals-container">
          <div class="meal-section">
            <div class="meal-title">
              <span class="meal-emoji">🌅</span>
              <span>Breakfast</span>
            </div>
            <div class="meal-name">${day.meals.breakfast.name}</div>
            <div class="meal-details">
              <div class="detail-box">
                <div class="detail-label">Ingredients</div>
                <ul class="ingredients-list">
                  ${day.meals.breakfast.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
              </div>
              <div class="detail-box">
                <div class="detail-label">Preparation</div>
                <div class="prep-time">${day.meals.breakfast.preparation_time}</div>
                <div style="margin-top: 10px; color: #6b7280; font-size: 0.9rem;">
                  Method: ${day.meals.breakfast.cooking_method}
                </div>
              </div>
            </div>
            <div class="health-benefits">
              <h4>Health Benefits</h4>
              <div class="benefits-list">${day.meals.breakfast.health_benefits.join(' • ')}</div>
            </div>
          </div>
          
          <div class="meal-section">
            <div class="meal-title">
              <span class="meal-emoji">☀️</span>
              <span>Lunch</span>
            </div>
            <div class="meal-name">${day.meals.lunch.name}</div>
            <div class="meal-details">
              <div class="detail-box">
                <div class="detail-label">Ingredients</div>
                <ul class="ingredients-list">
                  ${day.meals.lunch.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
              </div>
              <div class="detail-box">
                <div class="detail-label">Preparation</div>
                <div class="prep-time">${day.meals.lunch.preparation_time}</div>
                <div style="margin-top: 10px; color: #6b7280; font-size: 0.9rem;">
                  Method: ${day.meals.lunch.cooking_method}
                </div>
              </div>
            </div>
            <div class="health-benefits">
              <h4>Health Benefits</h4>
              <div class="benefits-list">${day.meals.lunch.health_benefits.join(' • ')}</div>
            </div>
          </div>
          
          <div class="meal-section">
            <div class="meal-title">
              <span class="meal-emoji">🌙</span>
              <span>Dinner</span>
            </div>
            <div class="meal-name">${day.meals.dinner.name}</div>
            <div class="meal-details">
              <div class="detail-box">
                <div class="detail-label">Ingredients</div>
                <ul class="ingredients-list">
                  ${day.meals.dinner.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
              </div>
              <div class="detail-box">
                <div class="detail-label">Preparation</div>
                <div class="prep-time">${day.meals.dinner.preparation_time}</div>
                <div style="margin-top: 10px; color: #6b7280; font-size: 0.9rem;">
                  Method: ${day.meals.dinner.cooking_method}
                </div>
              </div>
            </div>
            <div class="health-benefits">
              <h4>Health Benefits</h4>
              <div class="benefits-list">${day.meals.dinner.health_benefits.join(' • ')}</div>
            </div>
          </div>
          
          <div class="meal-section">
            <div class="meal-title">
              <span class="meal-emoji">🍓</span>
              <span>Healthy Snacks</span>
            </div>
            <div class="snacks-grid">
              ${day.meals.snacks.map(snack => `
                <div class="snack-card">
                  <h4 style="color: #be185d; margin-bottom: 10px;">${snack.name}</h4>
                  <div class="detail-label">Ingredients</div>
                  <ul class="ingredients-list" style="margin-bottom: 10px;">
                    ${snack.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                  </ul>
                  <div class="prep-time">${snack.preparation_time}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('')}
    
    <div class="shopping-list">
      <div class="shopping-header">🛒 Weekly Shopping List</div>
      ${Object.entries(weeklyPlan.weeklyShoppingList).map(([category, items]) => `
        <div class="category-section">
          <div class="category-title">${category.replace(/_/g, ' ')}</div>
          <ul class="category-items">
            ${items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    
    <div class="footer-note">
      <strong>💖 Wellness Note:</strong><br>
      This meal plan is designed to support your unique health journey. Listen to your body, stay hydrated, 
      and remember that small, consistent changes lead to lasting transformation. You've got this! 🌸
    </div>
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
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Meal Plan - Women's Health Nutrition</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #2d3748;
      background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #ec4899, #be185d);
      color: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 300;
      letter-spacing: 2px;
    }
    
    .month-overview {
      background: white;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 40px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 2px solid #fce7f3;
    }
    
    .week-card {
      background: white;
      margin-bottom: 30px;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      border: 2px solid #fce7f3;
    }
    
    .week-header {
      background: linear-gradient(135deg, #a855f7, #9333ea);
      color: white;
      padding: 15px 25px;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .nutritional-summary {
      background: linear-gradient(135deg, #fef7ff, #fdf4ff);
      padding: 25px;
      border-radius: 15px;
      border-left: 5px solid #ec4899;
      margin: 20px 0;
    }
    
    .shopping-list {
      background: white;
      border-radius: 20px;
      padding: 40px;
      margin-top: 50px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 3px solid #ec4899;
    }
    
    .category-section {
      margin-bottom: 25px;
      background: linear-gradient(135deg, #fef7ff, #fdf4ff);
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #ec4899;
    }
    
    .category-title {
      color: #be185d;
      font-size: 1.1rem;
      margin-bottom: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .category-items {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }
    
    .category-items li {
      background: white;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #fce7f3;
      color: #374151;
      font-size: 0.9rem;
    }
    
    .category-items li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      margin-right: 6px;
    }
    
    .footer-note {
      text-align: center;
      margin-top: 40px;
      padding: 25px;
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border-radius: 15px;
      color: #be185d;
      font-style: italic;
      border: 2px solid #ec4899;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌸 Monthly ${cuisineStyle} Meal Plan</h1>
      <div class="subtitle">Complete Women's Health Nutrition Guide</div>
    </div>
    
    <div class="month-overview">
      <h2 style="color: #be185d; margin-bottom: 20px;">${monthlyPlan.month} ${monthlyPlan.year} Overview</h2>
      
      <div class="nutritional-summary">
        <h3 style="color: #be185d; margin-bottom: 15px;">Nutritional Focus Areas</h3>
        <div style="margin-bottom: 15px;">
          <strong>Health Goals:</strong> ${monthlyPlan.nutritionalSummary.healthGoals.join(', ')}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Key Nutrients:</strong> ${monthlyPlan.nutritionalSummary.keyNutrients.join(', ')}
        </div>
        <div>
          <strong>Focus Areas:</strong> ${monthlyPlan.nutritionalSummary.focusAreas.join(', ')}
        </div>
      </div>
    </div>
    
    ${monthlyPlan.weeks.map(week => `
      <div class="week-card">
        <div class="week-header">
          Week ${week.week} - ${cuisineStyle} Cuisine
        </div>
        <div style="padding: 20px;">
          <p style="color: #6b7280; margin-bottom: 15px;">
            This week focuses on balanced nutrition with ${week.days.length} days of carefully planned meals 
            designed to support your health goals.
          </p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <strong>Sample Meals This Week:</strong><br>
            • Breakfast: ${week.days[0]?.meals.breakfast.name}<br>
            • Lunch: ${week.days[0]?.meals.lunch.name}<br>
            • Dinner: ${week.days[0]?.meals.dinner.name}
          </div>
        </div>
      </div>
    `).join('')}
    
    <div class="shopping-list">
      <div style="text-align: center; margin-bottom: 30px; color: #be185d; font-size: 2rem;">
        🛒 Complete Monthly Shopping List
      </div>
      <p style="text-align: center; color: #6b7280; margin-bottom: 30px; font-style: italic;">
        Organized by category for efficient shopping
      </p>
      
      ${Object.entries(monthlyPlan.monthlyShoppingList).map(([category, items]) => `
        <div class="category-section">
          <div class="category-title">${category.replace(/_/g, ' ')}</div>
          <ul class="category-items">
            ${items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    
    <div class="footer-note">
      <strong>💖 Monthly Wellness Journey:</strong><br>
      This comprehensive monthly meal plan is crafted to support your health goals throughout the entire month. 
      Each week builds upon the last, creating sustainable habits that nourish your body and soul. 
      Remember to stay hydrated, listen to your body, and celebrate every small victory on your wellness journey!
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();