// Test script to demonstrate evaluation metrics system
// Run this in browser console or as a standalone test

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'demo-token';

async function testEvaluationMetrics() {
  console.log('🧪 Testing Evaluation Metrics System');
  
  async function apiCall(endpoint, method = 'GET') {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  try {
    console.log('\n📊 Testing Research Quality Metrics...');
    const researchMetrics = await apiCall('/api/evaluation/research-quality');
    console.log('Research Quality:', {
      totalArticles: researchMetrics.metrics.totalArticles,
      averageContentLength: Math.round(researchMetrics.metrics.averageContentLength),
      qualityScore: researchMetrics.metrics.qualityScore.toFixed(2),
      recentArticlesPercentage: researchMetrics.metrics.recentArticlesPercentage.toFixed(1) + '%'
    });

    console.log('\n🍽️ Testing Meal Plan Quality Metrics...');
    const mealPlanMetrics = await apiCall('/api/evaluation/meal-plan-quality');
    console.log('Meal Plan Quality:', {
      nutritionalCompleteness: mealPlanMetrics.metrics.nutritionalCompleteness.toFixed(1),
      varietyScore: mealPlanMetrics.metrics.varietyScore.toFixed(1),
      healthConditionAlignment: mealPlanMetrics.metrics.healthConditionAlignment.toFixed(1),
      overallQuality: mealPlanMetrics.metrics.overallQuality.toFixed(1)
    });

    console.log('\n🧠 Testing Adaptive Response Metrics...');
    const adaptiveMetrics = await apiCall('/api/evaluation/adaptive-responses');
    console.log('Adaptive Responses:', {
      responseAccuracy: adaptiveMetrics.metrics.responseAccuracy.toFixed(1),
      personalizationDepth: adaptiveMetrics.metrics.personalizationDepth.toFixed(1),
      feedbackIntegration: adaptiveMetrics.metrics.feedbackIntegration.toFixed(1),
      userSatisfactionPredict: adaptiveMetrics.metrics.userSatisfactionPredict.toFixed(1)
    });

    console.log('\n💬 Testing Chatbot Performance Metrics...');
    const chatbotMetrics = await apiCall('/api/evaluation/chatbot-performance');
    console.log('Chatbot Performance:', {
      responseRelevance: chatbotMetrics.metrics.responseRelevance.toFixed(1),
      scientificAccuracy: chatbotMetrics.metrics.scientificAccuracy.toFixed(1),
      empathyScore: chatbotMetrics.metrics.empathyScore.toFixed(1),
      actionabilityScore: chatbotMetrics.metrics.actionabilityScore.toFixed(1)
    });

    console.log('\n📈 Testing Comprehensive Report...');
    const comprehensiveReport = await apiCall('/api/evaluation/comprehensive-report');
    console.log('Comprehensive Report:', {
      overallScore: comprehensiveReport.report.overallScore.toFixed(2),
      recommendationsCount: comprehensiveReport.report.recommendations.length,
      recommendations: comprehensiveReport.report.recommendations
    });

    console.log('\n✅ All evaluation metrics tests completed successfully!');
    
    // Summary table
    console.log('\n📋 Summary of System Performance:');
    console.table({
      'Research Data Quality': researchMetrics.metrics.qualityScore.toFixed(1) + '/10',
      'Meal Plan Quality': mealPlanMetrics.metrics.overallQuality.toFixed(1) + '/10',
      'Adaptive AI Performance': adaptiveMetrics.metrics.userSatisfactionPredict.toFixed(1) + '/10',
      'Chatbot Performance': ((chatbotMetrics.metrics.responseRelevance + chatbotMetrics.metrics.scientificAccuracy) / 2).toFixed(1) + '/10',
      'Overall System Score': comprehensiveReport.report.overallScore.toFixed(1) + '/10'
    });

  } catch (error) {
    console.error('❌ Evaluation metrics test failed:', error);
    
    if (error.message.includes('401')) {
      console.log('💡 Authentication issue - make sure you\'re logged in');
    } else if (error.message.includes('404')) {
      console.log('💡 Endpoint not found - evaluation system may not be deployed');
    } else {
      console.log('💡 Check server logs for detailed error information');
    }
  }
}

// Auto-run the test
testEvaluationMetrics();

// Export for manual testing
window.testEvaluationMetrics = testEvaluationMetrics;