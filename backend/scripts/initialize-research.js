const { researchService } = require('../research.ts');

async function initializeResearch() {
  try {
    console.log('Starting research database initialization...');
    
    // Check if research service is enabled
    if (!researchService.isServiceEnabled()) {
      console.error('Research service is disabled. Please check your API keys:');
      console.error('- FIRECRAWL_API_KEY');
      console.error('- PINECONE_API_KEY');
      console.error('- OPENAI_API_KEY');
      return;
    }
    
    // Initialize the research database
    await researchService.initializeResearchDatabase();
    
    console.log('Research database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing research database:', error);
  }
}

// Run the initialization
initializeResearch(); 