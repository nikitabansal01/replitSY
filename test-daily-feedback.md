# Testing Daily Feedback System

## How to Test the "Next Day" Feedback Flow

### API Endpoints Overview
1. **Daily Check-in**: `GET /api/daily/check-in`
2. **Generate Meal Plan**: `POST /api/daily/meal-plan`
3. **Submit Feedback**: `POST /api/daily/feedback`
4. **Get Today's Plan**: `GET /api/daily/meal-plan/today`

### Test Scenario 1: First Time User
**Expected Behavior**: No feedback request, direct to meal plan generation

```bash
# 1. Call check-in endpoint
curl -X GET "http://localhost:5000/api/daily/check-in" \
  -H "Authorization: Bearer demo-token"

# Expected Response:
# {
#   "message": "Good morning! Ready to start your personalized nutrition journey?",
#   "followUpQuestions": ["How are you feeling today?", ...]
# }
```

### Test Scenario 2: User Returns Day 2 (No Feedback Given Yesterday)
**Expected Behavior**: Asks for feedback about yesterday's meal plan

```bash
# 1. First, generate a meal plan for "yesterday"
curl -X POST "http://localhost:5000/api/daily/meal-plan" \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Wait or simulate next day by calling check-in
curl -X GET "http://localhost:5000/api/daily/check-in" \
  -H "Authorization: Bearer demo-token"

# Expected Response:
# {
#   "message": "Good morning! How did yesterday's meal plan work for you?",
#   "followUpQuestions": ["Did you follow the meal plan?", "Which meals did you enjoy most?", ...]
# }
```

### Test Scenario 3: User Returns After Giving Feedback
**Expected Behavior**: Shows adaptive recommendations based on previous feedback

```bash
# 1. Generate yesterday's meal plan (if not already done)
curl -X POST "http://localhost:5000/api/daily/meal-plan" \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Submit feedback for yesterday
curl -X POST "http://localhost:5000/api/daily/feedback" \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-19",
    "followedPlan": true,
    "enjoyedMeals": ["breakfast", "lunch"],
    "dislikedMeals": ["dinner"],
    "energyLevel": 2,
    "digestiveHealth": 4,
    "moodRating": 3,
    "feedback": "Dinner was too spicy for me"
  }'

# 3. Call check-in next day
curl -X GET "http://localhost:5000/api/daily/check-in" \
  -H "Authorization: Bearer demo-token"

# Expected Response:
# {
#   "message": "Good morning! Based on your feedback from yesterday, I've got some personalized adjustments for today's plan.",
#   "followUpQuestions": ["How are you feeling this morning?", "Ready for today's adapted meal plan?"],
#   "adaptiveRecommendations": ["Adding more iron-rich foods and B-vitamins for energy support", "Replacing dinner with alternatives you'll enjoy more"]
# }
```

## Frontend Testing (Using Browser DevTools)

### Navigate to Daily Planner
1. Go to `/daily-planner` in your browser
2. Open DevTools Network tab
3. Watch the API calls being made

### Expected Flow:
1. **Page loads** → Calls `GET /api/daily/check-in`
2. **User clicks "Generate Plan"** → Calls `POST /api/daily/meal-plan`
3. **User submits feedback** → Calls `POST /api/daily/feedback`
4. **Next day visit** → Check-in shows adaptive recommendations

## Simulating "Next Day" for Testing

### Method 1: Modify Date Logic (Development Only)
Temporarily modify the date calculation in `adaptive-meal-planner.ts`:

```typescript
// Change this line for testing:
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// To this for testing:
const yesterday = new Date('2024-12-18'); // Use a fixed past date
```

### Method 2: Database Direct Testing
Insert test data directly into the storage system:

```typescript
// In browser console or test script:
fetch('/api/daily/meal-plan', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer demo-token',
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({})
}).then(() => {
  // Then test the check-in endpoint
  return fetch('/api/daily/check-in', {
    headers: { 'Authorization': 'Bearer demo-token' }
  });
}).then(res => res.json()).then(console.log);
```

## Key Testing Points

### 1. State Transitions
- No previous plan → Welcome message
- Has plan, no feedback → Feedback request
- Has feedback → Adaptive recommendations

### 2. Feedback Integration
- Low energy (< 3) → Iron and B-vitamin recommendations
- Poor digestion (< 3) → Fiber and gut-friendly foods
- Low mood (< 3) → Omega-3 and magnesium
- Disliked meals → Alternative suggestions

### 3. Persistence
- Meal plans saved with date stamps
- Feedback linked to specific meal plans
- Check-in logic based on historical data

## Verification Steps

1. **Check Storage**: Verify data is being saved correctly
2. **API Responses**: Confirm correct messages for each scenario
3. **Adaptive Logic**: Test that feedback influences recommendations
4. **Date Handling**: Ensure yesterday/today logic works properly