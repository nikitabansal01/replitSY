// Test script to demonstrate daily feedback system
// Run this in browser console or as a Node.js script

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'demo-token';

async function testDailyFeedbackFlow() {
  console.log('🧪 Testing Daily Feedback System');
  
  // Helper function for API calls
  async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log(`${method} ${endpoint}:`, data);
    return data;
  }

  try {
    // Test 1: First time user - should get welcome message
    console.log('\n📅 Test 1: First time user check-in');
    const firstCheckIn = await apiCall('/api/daily/check-in');
    
    if (firstCheckIn.message.includes('personalized nutrition journey')) {
      console.log('✅ First time user flow working correctly');
    } else {
      console.log('❌ Unexpected first time user response');
    }

    // Test 2: Generate first meal plan
    console.log('\n🍽️ Test 2: Generate initial meal plan');
    const firstMealPlan = await apiCall('/api/daily/meal-plan', 'POST', {});
    
    if (firstMealPlan.success) {
      console.log('✅ First meal plan generated successfully');
    } else {
      console.log('❌ Failed to generate first meal plan');
    }

    // Test 3: Simulate "next day" by checking if system asks for feedback
    console.log('\n📝 Test 3: Next day check-in (should ask for feedback)');
    const secondCheckIn = await apiCall('/api/daily/check-in');
    
    if (secondCheckIn.message.includes('yesterday\'s meal plan')) {
      console.log('✅ System correctly asks for feedback about yesterday');
    } else {
      console.log('❌ System did not ask for yesterday\'s feedback');
      console.log('Note: This might be expected if feedback was already given or no meal plan exists');
    }

    // Test 4: Submit feedback with low energy and disliked meal
    console.log('\n💬 Test 4: Submit feedback (low energy, disliked dinner)');
    const today = new Date().toISOString().split('T')[0];
    const feedbackData = {
      date: today,
      followedPlan: true,
      enjoyedMeals: ['breakfast', 'lunch'],
      dislikedMeals: ['dinner'],
      energyLevel: 2, // Low energy
      digestiveHealth: 4,
      moodRating: 3,
      feedback: 'Dinner was too spicy and I felt tired all day'
    };
    
    const feedbackResponse = await apiCall('/api/daily/feedback', 'POST', feedbackData);
    
    if (feedbackResponse.success) {
      console.log('✅ Feedback submitted successfully');
    } else {
      console.log('❌ Failed to submit feedback');
    }

    // Test 5: Check-in after feedback should show adaptive recommendations
    console.log('\n🔄 Test 5: Check-in after feedback (should show adaptations)');
    const adaptiveCheckIn = await apiCall('/api/daily/check-in');
    
    if (adaptiveCheckIn.adaptiveRecommendations && adaptiveCheckIn.adaptiveRecommendations.length > 0) {
      console.log('✅ System shows adaptive recommendations:');
      adaptiveCheckIn.adaptiveRecommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    } else {
      console.log('❌ No adaptive recommendations found');
    }

    // Test 6: Generate adapted meal plan
    console.log('\n🍽️ Test 6: Generate adapted meal plan');
    const adaptedMealPlan = await apiCall('/api/daily/meal-plan', 'POST', {
      previousFeedback: feedbackData
    });
    
    if (adaptedMealPlan.success) {
      console.log('✅ Adapted meal plan generated successfully');
      if (adaptedMealPlan.mealPlan.adaptations) {
        console.log('Adaptations applied:');
        adaptedMealPlan.mealPlan.adaptations.forEach(adaptation => {
          console.log(`  - ${adaptation}`);
        });
      }
    } else {
      console.log('❌ Failed to generate adapted meal plan');
    }

    console.log('\n🎉 Daily feedback flow test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDailyFeedbackFlow();