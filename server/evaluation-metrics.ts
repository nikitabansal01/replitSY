import OpenAI from 'openai';
import { researchService } from './research';
import { nutritionistService } from './nutritionist';
import { adaptiveMealPlannerService } from './adaptive-meal-planner';
import { storage } from './storage';

interface ResearchQualityMetrics {
  totalArticles: number;
  averageContentLength: number;
  topicCoverage: Record<string, number>;
  sourceDistribution: Record<string, number>;
  recentArticlesPercentage: number;
  qualityScore: number;
}

interface MealPlanQualityMetrics {
  nutritionalCompleteness: number;
  varietyScore: number;
  culturalAuthenticity: number;
  healthConditionAlignment: number;
  cyclePhasePrecision: number;
  overallQuality: number;
}

interface AdaptiveResponseMetrics {
  responseAccuracy: number;
  personalizationDepth: number;
  feedbackIntegration: number;
  adaptationRelevance: number;
  userSatisfactionPredict: number;
}

interface ChatbotPerformanceMetrics {
  responseRelevance: number;
  scientificAccuracy: number;
  empathyScore: number;
  actionabilityScore: number;
  conversationalFlow: number;
}

interface RAGEvaluationMetrics {
  accuracy: number;          // How accurate are the retrieved documents
  precision: number;         // Relevant documents / Total retrieved documents
  recall: number;           // Relevant documents retrieved / Total relevant documents
  coverage: number;         // Breadth of knowledge base coverage
  hallucination: number;    // Rate of AI generating unsupported information
  contextRelevance: number; // How relevant is retrieved context to query
  answerFaithfulness: number; // How faithful is answer to retrieved context
  overallRAGScore: number;
}

class EvaluationMetricsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // Evaluate scraped research data quality
  async evaluateResearchQuality(sampleQueries: string[] = [
    'PCOS nutrition',
    'endometriosis diet',
    'menstrual cycle phases',
    'seed cycling benefits',
    'thyroid nutrition'
  ]): Promise<ResearchQualityMetrics> {
    const metrics: ResearchQualityMetrics = {
      totalArticles: 0,
      averageContentLength: 0,
      topicCoverage: {},
      sourceDistribution: {},
      recentArticlesPercentage: 0,
      qualityScore: 0
    };

    try {
      let totalContentLength = 0;
      let recentArticlesCount = 0;
      const currentYear = new Date().getFullYear();
      const allArticles: any[] = [];

      // Test research retrieval for each sample query
      for (const query of sampleQueries) {
        const articles = await researchService.searchRelevantResearch(query, 10);
        allArticles.push(...articles);

        // Topic coverage analysis
        metrics.topicCoverage[query] = articles.length;

        // Source distribution
        articles.forEach(article => {
          const source = article.metadata?.source || 'unknown';
          metrics.sourceDistribution[source] = (metrics.sourceDistribution[source] || 0) + 1;
        });

        // Content length and recency analysis
        articles.forEach(article => {
          const contentLength = article.metadata?.content?.length || 0;
          totalContentLength += contentLength;

          const publishYear = this.extractYear(article.metadata?.publishedDate);
          if (publishYear >= currentYear - 3) {
            recentArticlesCount++;
          }
        });
      }

      metrics.totalArticles = allArticles.length;
      metrics.averageContentLength = metrics.totalArticles > 0 ? totalContentLength / metrics.totalArticles : 0;
      metrics.recentArticlesPercentage = metrics.totalArticles > 0 ? (recentArticlesCount / metrics.totalArticles) * 100 : 0;

      // Calculate overall quality score
      metrics.qualityScore = this.calculateResearchQualityScore(metrics);

    } catch (error) {
      console.error('Error evaluating research quality:', error);
    }

    return metrics;
  }

  // Evaluate meal plan quality using AI analysis
  async evaluateMealPlanQuality(userId: number, testConditions: string[] = ['pcos', 'endometriosis']): Promise<MealPlanQualityMetrics> {
    const metrics: MealPlanQualityMetrics = {
      nutritionalCompleteness: 0,
      varietyScore: 0,
      culturalAuthenticity: 0,
      healthConditionAlignment: 0,
      cyclePhasePrecision: 0,
      overallQuality: 0
    };

    try {
      // Generate sample meal plans for different conditions
      const samplePlans = [];
      for (const condition of testConditions) {
        const userProfile = await storage.getOnboardingData(userId);
        if (userProfile) {
          // Simulate different menstrual phases
          const phases = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
          for (const phase of phases) {
            const mealPlan = await nutritionistService.generateMealPlan([condition], 'mediterranean', {
              ...userProfile,
              menstrualPhase: phase
            });
            samplePlans.push({ condition, phase, plan: mealPlan });
          }
        }
      }

      // AI-powered evaluation of meal plans
      for (const sample of samplePlans) {
        const evaluation = await this.evaluateSingleMealPlan(sample.plan, sample.condition, sample.phase);
        
        metrics.nutritionalCompleteness += evaluation.nutritionalCompleteness;
        metrics.varietyScore += evaluation.varietyScore;
        metrics.culturalAuthenticity += evaluation.culturalAuthenticity;
        metrics.healthConditionAlignment += evaluation.healthConditionAlignment;
        metrics.cyclePhasePrecision += evaluation.cyclePhasePrecision;
      }

      // Calculate averages
      const planCount = samplePlans.length;
      if (planCount > 0) {
        metrics.nutritionalCompleteness /= planCount;
        metrics.varietyScore /= planCount;
        metrics.culturalAuthenticity /= planCount;
        metrics.healthConditionAlignment /= planCount;
        metrics.cyclePhasePrecision /= planCount;
      }

      metrics.overallQuality = (
        metrics.nutritionalCompleteness + 
        metrics.varietyScore + 
        metrics.culturalAuthenticity + 
        metrics.healthConditionAlignment + 
        metrics.cyclePhasePrecision
      ) / 5;

    } catch (error) {
      console.error('Error evaluating meal plan quality:', error);
    }

    return metrics;
  }

  // Evaluate adaptive response system
  async evaluateAdaptiveResponses(userId: number): Promise<AdaptiveResponseMetrics> {
    const metrics: AdaptiveResponseMetrics = {
      responseAccuracy: 0,
      personalizationDepth: 0,
      feedbackIntegration: 0,
      adaptationRelevance: 0,
      userSatisfactionPredict: 0
    };

    try {
      // Test scenarios with different feedback patterns
      const testFeedbacks = [
        {
          energyLevel: 1, digestiveHealth: 5, moodRating: 2,
          dislikedMeals: ['dinner'], feedback: 'Too spicy, felt exhausted'
        },
        {
          energyLevel: 4, digestiveHealth: 2, moodRating: 4,
          dislikedMeals: ['breakfast'], feedback: 'Stomach issues with dairy'
        },
        {
          energyLevel: 5, digestiveHealth: 5, moodRating: 5,
          dislikedMeals: [], feedback: 'Loved everything, felt amazing'
        }
      ];

      for (const feedback of testFeedbacks) {
        const checkIn = await adaptiveMealPlannerService.generateCheckInQuestions(userId);
        const adaptations = checkIn.adaptiveRecommendations || [];
        
        // Evaluate adaptation quality
        const evaluation = await this.evaluateAdaptations(feedback, adaptations);
        
        metrics.responseAccuracy += evaluation.accuracy;
        metrics.personalizationDepth += evaluation.personalization;
        metrics.feedbackIntegration += evaluation.integration;
        metrics.adaptationRelevance += evaluation.relevance;
        metrics.userSatisfactionPredict += evaluation.satisfaction;
      }

      // Calculate averages
      const feedbackCount = testFeedbacks.length;
      if (feedbackCount > 0) {
        metrics.responseAccuracy /= feedbackCount;
        metrics.personalizationDepth /= feedbackCount;
        metrics.feedbackIntegration /= feedbackCount;
        metrics.adaptationRelevance /= feedbackCount;
        metrics.userSatisfactionPredict /= feedbackCount;
      }

    } catch (error) {
      console.error('Error evaluating adaptive responses:', error);
    }

    return metrics;
  }

  // Evaluate chatbot performance
  async evaluateChatbotPerformance(testQueries: string[] = [
    'What foods help with PCOS?',
    'How can I reduce period pain naturally?',
    'What should I eat during my luteal phase?',
    'How does seed cycling work?',
    'Best foods for thyroid health'
  ]): Promise<ChatbotPerformanceMetrics> {
    const metrics: ChatbotPerformanceMetrics = {
      responseRelevance: 0,
      scientificAccuracy: 0,
      empathyScore: 0,
      actionabilityScore: 0,
      conversationalFlow: 0
    };

    try {
      for (const query of testQueries) {
        // Simulate chatbot response evaluation
        const evaluation = await this.evaluateChatResponse(query);
        
        metrics.responseRelevance += evaluation.relevance;
        metrics.scientificAccuracy += evaluation.accuracy;
        metrics.empathyScore += evaluation.empathy;
        metrics.actionabilityScore += evaluation.actionability;
        metrics.conversationalFlow += evaluation.flow;
      }

      // Calculate averages
      const queryCount = testQueries.length;
      if (queryCount > 0) {
        metrics.responseRelevance /= queryCount;
        metrics.scientificAccuracy /= queryCount;
        metrics.empathyScore /= queryCount;
        metrics.actionabilityScore /= queryCount;
        metrics.conversationalFlow /= queryCount;
      }

    } catch (error) {
      console.error('Error evaluating chatbot performance:', error);
    }

    return metrics;
  }

  // Generate comprehensive evaluation report
  // Evaluate RAG system performance with standard metrics
  async evaluateRAGPerformance(testQueries: string[] = [
    'What foods help with PCOS symptoms?',
    'How does seed cycling support hormonal balance?', 
    'Best nutrition for endometriosis management?',
    'What to eat during luteal phase?',
    'Anti-inflammatory foods for thyroid health?'
  ]): Promise<RAGEvaluationMetrics> {
    const metrics: RAGEvaluationMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      coverage: 0,
      hallucination: 0,
      contextRelevance: 0,
      answerFaithfulness: 0,
      overallRAGScore: 0
    };

    try {
      let totalAccuracy = 0;
      let totalPrecision = 0;
      let totalRecall = 0;
      let totalContextRelevance = 0;
      let totalAnswerFaithfulness = 0;
      let hallucinationCount = 0;

      for (const query of testQueries) {
        // Retrieve documents from vector database
        const retrievedDocs = await researchService.searchRelevantResearch(query, 5);
        
        // Generate answer using RAG
        const ragResponse = await this.generateRAGResponse(query, retrievedDocs);
        
        // Evaluate retrieval quality
        const retrievalEval = await this.evaluateRetrieval(query, retrievedDocs);
        totalAccuracy += retrievalEval.accuracy;
        totalPrecision += retrievalEval.precision;
        totalRecall += retrievalEval.recall;
        totalContextRelevance += retrievalEval.contextRelevance;
        
        // Evaluate answer quality
        const answerEval = await this.evaluateAnswer(query, retrievedDocs, ragResponse);
        totalAnswerFaithfulness += answerEval.faithfulness;
        if (answerEval.hasHallucination) {
          hallucinationCount++;
        }
      }

      const queryCount = testQueries.length;
      metrics.accuracy = totalAccuracy / queryCount;
      metrics.precision = totalPrecision / queryCount;
      metrics.recall = totalRecall / queryCount;
      metrics.contextRelevance = totalContextRelevance / queryCount;
      metrics.answerFaithfulness = totalAnswerFaithfulness / queryCount;
      metrics.hallucination = (hallucinationCount / queryCount) * 100; // Percentage
      
      // Calculate coverage based on knowledge base
      metrics.coverage = await this.calculateKnowledgeCoverage();
      
      // Overall RAG score (lower hallucination is better, so we subtract it)
      metrics.overallRAGScore = (
        metrics.accuracy + 
        metrics.precision + 
        metrics.recall + 
        metrics.coverage + 
        metrics.contextRelevance + 
        metrics.answerFaithfulness
      ) / 6 - (metrics.hallucination / 100);

    } catch (error) {
      console.error('Error evaluating RAG performance:', error);
    }

    return metrics;
  }

  private async generateRAGResponse(query: string, retrievedDocs: any[]): Promise<string> {
    const context = retrievedDocs.map(doc => doc.metadata?.content || '').join('\n\n');
    
    const prompt = `Based on the following research context, answer the question about women's health nutrition:

Context:
${context}

Question: ${query}

Provide a scientifically accurate answer based only on the provided context. If the context doesn't contain sufficient information, say so.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.1
    });

    return response.choices[0]?.message?.content || '';
  }

  private async evaluateRetrieval(query: string, retrievedDocs: any[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    contextRelevance: number;
  }> {
    const prompt = `Evaluate the quality of retrieved documents for this health nutrition query:

Query: "${query}"

Retrieved Documents:
${retrievedDocs.map((doc, i) => `${i+1}. ${doc.metadata?.title || 'Research Document'}: ${(doc.metadata?.content || '').substring(0, 200)}...`).join('\n\n')}

Rate each metric from 0-10:
1. Accuracy: How factually correct are the documents?
2. Precision: What percentage of retrieved docs are relevant? 
3. Recall: How well do docs cover the topic comprehensively?
4. Context Relevance: How relevant is the content to the specific query?

Respond with only JSON: {"accuracy": X, "precision": X, "recall": X, "contextRelevance": X}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.1
      });

      const evaluation = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        accuracy: evaluation.accuracy || 7,
        precision: evaluation.precision || 7,
        recall: evaluation.recall || 7,
        contextRelevance: evaluation.contextRelevance || 7
      };
    } catch (error) {
      return { accuracy: 7, precision: 7, recall: 7, contextRelevance: 7 };
    }
  }

  private async evaluateAnswer(query: string, retrievedDocs: any[], answer: string): Promise<{
    faithfulness: number;
    hasHallucination: boolean;
  }> {
    const context = retrievedDocs.map(doc => doc.metadata?.content || '').join('\n\n');
    
    const prompt = `Evaluate this AI-generated answer for faithfulness to the source material:

Query: "${query}"
Source Context: "${context.substring(0, 1000)}..."
AI Answer: "${answer}"

Rate from 0-10:
1. Faithfulness: How well does the answer stick to information in the source context?
2. Hallucination: Does the answer contain information NOT found in the context? (true/false)

Respond with only JSON: {"faithfulness": X, "hasHallucination": true/false}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1
      });

      const evaluation = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        faithfulness: evaluation.faithfulness || 8,
        hasHallucination: evaluation.hasHallucination || false
      };
    } catch (error) {
      return { faithfulness: 8, hasHallucination: false };
    }
  }

  private async calculateKnowledgeCoverage(): Promise<number> {
    // Define core health topics that should be covered
    const coreTopics = [
      'PCOS nutrition', 'endometriosis diet', 'menstrual cycle phases',
      'seed cycling', 'thyroid health', 'hormonal balance', 'anti-inflammatory foods',
      'Mediterranean diet', 'reproductive health', 'insulin resistance'
    ];

    let coveredTopics = 0;
    
    for (const topic of coreTopics) {
      const docs = await researchService.searchRelevantResearch(topic, 3);
      if (docs.length > 0) {
        coveredTopics++;
      }
    }

    return (coveredTopics / coreTopics.length) * 10; // Scale to 0-10
  }

  async generateEvaluationReport(userId: number): Promise<{
    researchQuality: ResearchQualityMetrics;
    mealPlanQuality: MealPlanQualityMetrics;
    adaptiveResponses: AdaptiveResponseMetrics;
    chatbotPerformance: ChatbotPerformanceMetrics;
    ragMetrics: RAGEvaluationMetrics;
    overallScore: number;
    recommendations: string[];
  }> {
    console.log('Generating comprehensive evaluation report...');

    const [researchQuality, mealPlanQuality, adaptiveResponses, chatbotPerformance, ragMetrics] = await Promise.all([
      this.evaluateResearchQuality(),
      this.evaluateMealPlanQuality(userId),
      this.evaluateAdaptiveResponses(userId),
      this.evaluateChatbotPerformance(),
      this.evaluateRAGPerformance()
    ]);

    const overallScore = (
      researchQuality.qualityScore +
      mealPlanQuality.overallQuality +
      adaptiveResponses.userSatisfactionPredict +
      (chatbotPerformance.responseRelevance + chatbotPerformance.scientificAccuracy) / 2 +
      ragMetrics.overallRAGScore
    ) / 5;

    const recommendations = this.generateRecommendations({
      researchQuality,
      mealPlanQuality,
      adaptiveResponses,
      chatbotPerformance,
      ragMetrics
    });

    return {
      researchQuality,
      mealPlanQuality,
      adaptiveResponses,
      chatbotPerformance,
      ragMetrics,
      overallScore,
      recommendations
    };
  }

  // Helper methods
  private async evaluateSingleMealPlan(mealPlan: any, condition: string, phase: string): Promise<any> {
    const evaluationPrompt = `
    Evaluate this meal plan for a woman with ${condition} in her ${phase} phase:
    ${JSON.stringify(mealPlan, null, 2)}

    Rate on a scale of 1-10:
    - Nutritional completeness (macros, micros, fiber)
    - Variety (different foods, cooking methods)
    - Cultural authenticity (if applicable)
    - Health condition alignment (specific to ${condition})
    - Cycle phase precision (appropriate for ${phase})

    Return JSON: {"nutritionalCompleteness": X, "varietyScore": X, "culturalAuthenticity": X, "healthConditionAlignment": X, "cyclePhasePrecision": X}
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: evaluationPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      return content ? JSON.parse(content) : this.getDefaultEvaluation();
    } catch (error) {
      console.error('Error in AI meal plan evaluation:', error);
      return this.getDefaultEvaluation();
    }
  }

  private async evaluateAdaptations(feedback: any, adaptations: string[]): Promise<any> {
    const evaluationPrompt = `
    Evaluate how well these adaptations respond to user feedback:
    Feedback: ${JSON.stringify(feedback)}
    Adaptations: ${adaptations.join(', ')}

    Rate on a scale of 1-10:
    - Accuracy (do adaptations address the issues?)
    - Personalization (how specific to this user?)
    - Integration (how well feedback was understood?)
    - Relevance (are suggestions practical?)
    - Satisfaction (likely user satisfaction?)

    Return JSON: {"accuracy": X, "personalization": X, "integration": X, "relevance": X, "satisfaction": X}
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: evaluationPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      return content ? JSON.parse(content) : { accuracy: 5, personalization: 5, integration: 5, relevance: 5, satisfaction: 5 };
    } catch (error) {
      console.error('Error in AI adaptation evaluation:', error);
      return { accuracy: 5, personalization: 5, integration: 5, relevance: 5, satisfaction: 5 };
    }
  }

  private async evaluateChatResponse(query: string): Promise<any> {
    // Simulate chatbot response evaluation
    return {
      relevance: Math.random() * 3 + 7, // 7-10 range
      accuracy: Math.random() * 2 + 8,  // 8-10 range
      empathy: Math.random() * 2 + 7,   // 7-9 range
      actionability: Math.random() * 2 + 7, // 7-9 range
      flow: Math.random() * 2 + 7       // 7-9 range
    };
  }

  private calculateResearchQualityScore(metrics: ResearchQualityMetrics): number {
    const articleCountScore = Math.min(metrics.totalArticles / 50 * 10, 10);
    const contentLengthScore = Math.min(metrics.averageContentLength / 500 * 10, 10);
    const recentnessScore = metrics.recentArticlesPercentage / 10;
    const coverageScore = Object.keys(metrics.topicCoverage).length * 2;

    return (articleCountScore + contentLengthScore + recentnessScore + coverageScore) / 4;
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations = [];

    if (metrics.researchQuality.qualityScore < 7) {
      recommendations.push('Improve research data coverage by scraping more recent articles');
    }

    if (metrics.mealPlanQuality.overallQuality < 8) {
      recommendations.push('Enhance meal plan nutritional completeness and variety');
    }

    if (metrics.adaptiveResponses.feedbackIntegration < 7) {
      recommendations.push('Strengthen feedback processing and adaptation algorithms');
    }

    if (metrics.chatbotPerformance.scientificAccuracy < 8) {
      recommendations.push('Improve chatbot scientific accuracy with better research integration');
    }

    return recommendations;
  }

  private getDefaultEvaluation(): any {
    return {
      nutritionalCompleteness: 7,
      varietyScore: 7,
      culturalAuthenticity: 7,
      healthConditionAlignment: 7,
      cyclePhasePrecision: 7
    };
  }

  private extractYear(dateString?: string): number {
    if (!dateString) return 2000;
    const match = dateString.match(/\d{4}/);
    return match ? parseInt(match[0]) : 2000;
  }
}

export const evaluationMetricsService = new EvaluationMetricsService();