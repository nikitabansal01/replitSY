import FirecrawlApp from '@mendable/firecrawl-js';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

interface ResearchArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  publishedDate?: string;
  topics: string[];
  embedding?: number[];
}

class ResearchService {
  private firecrawl: FirecrawlApp;
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName = 'health-research';
  private knowledgeGapThreshold = 0.7; // Similarity threshold to determine if new scraping is needed

  constructor() {
    this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // Initialize Pinecone index for health research
  async initializeIndex(): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    } catch (error) {
      console.error('Error initializing Pinecone index:', error);
    }
  }

  // Scrape research articles from health databases
  async scrapeHealthResearch(topics: string[]): Promise<ResearchArticle[]> {
    const articles: ResearchArticle[] = [];
    
    // Health research URLs to scrape
    const researchSources = [
      'https://pubmed.ncbi.nlm.nih.gov',
      'https://www.niddk.nih.gov',
      'https://www.womenshealth.gov',
      'https://www.ncbi.nlm.nih.gov/pmc'
    ];

    for (const topic of topics) {
      try {
        // Search for research articles using Firecrawl
        const searchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(topic + ' women health hormones')}`;
        
        const crawlResult = await this.firecrawl.scrapeUrl(searchUrl, {
          formats: ['markdown'],
          includeTags: ['article', 'main', 'div'],
          excludeTags: ['nav', 'footer', 'aside'],
          waitFor: 2000
        });

        if (crawlResult.success && crawlResult.markdown) {
          // Extract article information from scraped content
          const extractedArticles = this.parseScrapedContent(crawlResult.markdown, topic, searchUrl);
          articles.push(...extractedArticles);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping research for topic ${topic}:`, error);
      }
    }

    return articles;
  }

  // Parse scraped content to extract research articles
  private parseScrapedContent(content: string, topic: string, sourceUrl: string): ResearchArticle[] {
    const articles: ResearchArticle[] = [];
    
    // Split content into potential article sections
    const sections = content.split(/\n\n+/);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      // Look for patterns that indicate research articles
      if (section.length > 100 && 
          (section.includes('Abstract') || 
           section.includes('PMID') || 
           section.includes('DOI') ||
           section.includes('Journal'))) {
        
        const article: ResearchArticle = {
          id: `research_${Date.now()}_${i}`,
          title: this.extractTitle(section),
          content: section,
          url: sourceUrl,
          source: 'PubMed',
          topics: [topic],
          publishedDate: this.extractPublishDate(section)
        };
        
        articles.push(article);
      }
    }
    
    return articles;
  }

  // Extract title from article content
  private extractTitle(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().length > 20 && line.trim().length < 200) {
        // Remove markdown formatting
        return line.replace(/[#*_]/g, '').trim();
      }
    }
    return 'Research Article';
  }

  // Extract publication date from content
  private extractPublishDate(content: string): string | undefined {
    const datePattern = /\b(20\d{2})\b/;
    const match = content.match(datePattern);
    return match ? match[1] : undefined;
  }

  // Generate embeddings for research articles
  async generateEmbeddings(articles: ResearchArticle[]): Promise<ResearchArticle[]> {
    const articlesWithEmbeddings: ResearchArticle[] = [];

    for (const article of articles) {
      try {
        const embeddingResponse = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: `${article.title}\n\n${article.content}`,
        });

        const embedding = embeddingResponse.data[0]?.embedding;
        if (embedding) {
          articlesWithEmbeddings.push({
            ...article,
            embedding
          });
        }

        // Rate limiting for OpenAI API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generating embedding for article ${article.id}:`, error);
      }
    }

    return articlesWithEmbeddings;
  }

  // Store research articles in Pinecone vector database
  async storeInVectorDB(articles: ResearchArticle[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const vectors = articles
        .filter(article => article.embedding)
        .map(article => ({
          id: article.id,
          values: article.embedding!,
          metadata: {
            title: article.title,
            content: article.content.substring(0, 1000),
            url: article.url,
            source: article.source,
            topics: article.topics.join(','),
            publishedDate: article.publishedDate || 'unknown'
          } as Record<string, any>
        }));

      if (vectors.length > 0) {
        await index.upsert(vectors);
        console.log(`Stored ${vectors.length} research articles in vector database`);
      }
    } catch (error) {
      console.error('Error storing articles in vector database:', error);
    }
  }

  // Check if we have sufficient knowledge on a topic
  async hasKnowledgeGaps(query: string, minSimilarity: number = 0.7): Promise<boolean> {
    try {
      const matches = await this.searchRelevantResearch(query, 5);
      
      if (matches.length === 0) {
        return true; // No knowledge at all
      }

      // Check if the best match meets our similarity threshold
      const bestMatch = matches[0];
      return !bestMatch.score || bestMatch.score < minSimilarity;
    } catch (error) {
      console.error('Error checking knowledge gaps:', error);
      return true; // Assume gap if we can't check
    }
  }

  // Smart search that scrapes only when needed
  async searchWithSmartScraping(query: string, topK: number = 3): Promise<any[]> {
    let existingMatches: any[] = [];
    
    try {
      // First check existing knowledge
      existingMatches = await this.searchRelevantResearch(query, topK);
      const hasGaps = await this.hasKnowledgeGaps(query, this.knowledgeGapThreshold);

      if (!hasGaps && existingMatches.length > 0) {
        console.log('Using existing knowledge for query:', query);
        return existingMatches;
      }

      // If we have knowledge gaps, scrape for more specific information
      console.log('Knowledge gap detected, scraping for:', query);
      await this.scrapeSpecificTopic(query);

      // Search again after scraping
      return await this.searchRelevantResearch(query, topK);
    } catch (error) {
      console.error('Error in smart search:', error);
      return existingMatches;
    }
  }

  // Scrape specific topic when knowledge gaps are detected
  async scrapeSpecificTopic(topic: string): Promise<void> {
    try {
      const targetedSources = this.getTargetedSources(topic);
      const articles: ResearchArticle[] = [];

      for (const source of targetedSources) {
        try {
          const crawlResult = await this.firecrawl.scrapeUrl(source, {
            formats: ['markdown'],
            includeTags: ['article', 'main', 'div', 'section'],
            excludeTags: ['nav', 'footer', 'aside', 'header'],
            waitFor: 2000
          });

          if (crawlResult.success && crawlResult.markdown) {
            const extractedArticles = this.parseScrapedContent(crawlResult.markdown, topic, source);
            articles.push(...extractedArticles);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error scraping ${source}:`, error);
        }
      }

      if (articles.length > 0) {
        const articlesWithEmbeddings = await this.generateEmbeddings(articles);
        await this.storeInVectorDB(articlesWithEmbeddings);
        console.log(`Scraped and stored ${articlesWithEmbeddings.length} new articles for topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error scraping specific topic ${topic}:`, error);
    }
  }

  // Get targeted sources based on topic
  private getTargetedSources(topic: string): string[] {
    const lowerTopic = topic.toLowerCase();
    const baseUrl = 'https://pubmed.ncbi.nlm.nih.gov/?term=';
    
    if (lowerTopic.includes('pcos')) {
      return [
        `${baseUrl}${encodeURIComponent('PCOS polycystic ovary syndrome women nutrition diet')}`,
        `${baseUrl}${encodeURIComponent('PCOS natural treatment insulin resistance')}`,
        'https://www.womenshealth.gov/a-z-topics/polycystic-ovary-syndrome'
      ];
    }
    
    if (lowerTopic.includes('endometriosis')) {
      return [
        `${baseUrl}${encodeURIComponent('endometriosis pain management nutrition anti-inflammatory')}`,
        `${baseUrl}${encodeURIComponent('endometriosis diet omega-3 antioxidants')}`,
        'https://www.womenshealth.gov/a-z-topics/endometriosis'
      ];
    }
    
    if (lowerTopic.includes('stress') || lowerTopic.includes('cortisol')) {
      return [
        `${baseUrl}${encodeURIComponent('stress management women cortisol adaptogens')}`,
        `${baseUrl}${encodeURIComponent('chronic stress hormonal balance women nutrition')}`,
        'https://www.niddk.nih.gov/health-information/endocrine-diseases'
      ];
    }
    
    if (lowerTopic.includes('thyroid')) {
      return [
        `${baseUrl}${encodeURIComponent('thyroid health women nutrition selenium iodine')}`,
        `${baseUrl}${encodeURIComponent('hypothyroidism diet treatment women')}`,
        'https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism'
      ];
    }
    
    // Default sources for general women's health topics
    return [
      `${baseUrl}${encodeURIComponent(topic + ' women health nutrition')}`,
      'https://www.womenshealth.gov',
      'https://www.niddk.nih.gov/health-information'
    ];
  }

  // Search for relevant research based on user query
  async searchRelevantResearch(query: string, topK: number = 3): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding;
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Search in Pinecone
      const index = this.pinecone.index(this.indexName);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false
      });

      return searchResponse.matches || [];
    } catch (error) {
      console.error('Error searching relevant research:', error);
      return [];
    }
  }

  // Scrape and store research for common women's health topics
  async initializeResearchDatabase(): Promise<void> {
    console.log('Initializing comprehensive women\'s health research database...');
    
    const healthTopics = [
      // PCOS related topics
      'PCOS polycystic ovary syndrome nutrition diet',
      'PCOS insulin resistance natural treatment',
      'PCOS weight management metformin alternatives',
      'PCOS hormonal balance spearmint tea',
      'PCOS fertility natural conception support',
      
      // Endometriosis topics
      'endometriosis pain management anti-inflammatory diet',
      'endometriosis omega-3 fatty acids turmeric',
      'endometriosis iron deficiency anemia nutrition',
      'endometriosis hormonal therapy natural alternatives',
      'endometriosis fertility preservation nutrition',
      
      // Stress and cortisol management
      'chronic stress cortisol women health effects',
      'stress management adaptogens ashwagandha rhodiola',
      'cortisol regulation sleep hygiene women',
      'stress induced hormonal imbalance treatment',
      'adrenal fatigue natural recovery nutrition',
      
      // Thyroid health
      'hypothyroidism women nutrition selenium iodine',
      'thyroid health autoimmune hashimoto diet',
      'thyroid medication natural supplements interaction',
      'thyroid function vitamin D B12 deficiency',
      'hyperthyroidism graves disease nutrition management',
      
      // Menstrual health
      'menstrual cramps dysmenorrhea natural pain relief',
      'heavy menstrual bleeding iron supplementation',
      'irregular periods hormonal balance nutrition',
      'PMS premenstrual syndrome magnesium B6',
      'menstrual cycle tracking hormonal patterns',
      
      // Reproductive health
      'fertility nutrition preconception health women',
      'hormonal contraception side effects natural alternatives',
      'menopause symptoms hormone replacement therapy natural',
      'postmenopausal bone health calcium magnesium',
      'perimenopause symptom management nutrition',
      
      // General women's wellness
      'iron deficiency anemia women plant-based sources',
      'hormonal acne adult women natural treatment',
      'digestive health bloating women hormonal connection',
      'mood disorders women hormonal fluctuations',
      'breast health nutrition cancer prevention'
    ];

    try {
      await this.initializeIndex();
      
      console.log(`Starting to scrape ${healthTopics.length} specialized women's health topics...`);
      const articles = await this.scrapeHealthResearch(healthTopics);
      console.log(`Successfully scraped ${articles.length} research articles`);

      if (articles.length > 0) {
        const articlesWithEmbeddings = await this.generateEmbeddings(articles);
        console.log(`Generated embeddings for ${articlesWithEmbeddings.length} articles`);

        await this.storeInVectorDB(articlesWithEmbeddings);
        console.log('Comprehensive women\'s health research database initialization complete');
      } else {
        console.log('No articles were scraped - please check Firecrawl API key and connection');
      }
    } catch (error) {
      console.error('Error initializing research database:', error);
      throw error;
    }
  }
}

export const researchService = new ResearchService();