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

interface ScrapeResponse<T, E> {
  success: boolean;
  markdown?: string;
  error?: E;
  data?: T;
}

class ResearchService {
  private firecrawl?: FirecrawlApp;
  private pinecone?: Pinecone;
  private openai?: OpenAI;
  private indexName = 'health-research';
  private knowledgeGapThreshold = 0.7; // Similarity threshold to determine if new scraping is needed
  private isEnabled = false;

  constructor() {
    // Only initialize services if API keys are available
    if (process.env.FIRECRAWL_API_KEY) {
      this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    }
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Enable research service only if all required APIs are available
    this.isEnabled = !!(this.firecrawl && this.pinecone && this.openai);
    
    if (!this.isEnabled) {
      console.log('Research service is disabled. Some features may be limited.');
    }
  }

  // Check if research service is enabled
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Initialize Pinecone index for health research
  async initializeIndex(): Promise<void> {
    if (!this.isEnabled || !this.pinecone) {
      console.log('Research service is disabled. Skipping index initialization.');
      return;
    }

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
    if (!this.isEnabled || !this.firecrawl) {
      console.log('Research service is disabled. Returning empty results.');
      return [];
    }

    const articles: ResearchArticle[] = [];
    const researchSources = [
      'https://pubmed.ncbi.nlm.nih.gov',
      'https://www.niddk.nih.gov',
      'https://www.womenshealth.gov',
      'https://www.ncbi.nlm.nih.gov/pmc'
    ];

    for (const topic of topics) {
      try {
        const searchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(topic + ' women health hormones')}`;
        
        const crawlResult = await this.firecrawl.scrapeUrl(searchUrl, {
          formats: ['markdown'],
          includeTags: ['article', 'main', 'div'],
          excludeTags: ['nav', 'footer', 'aside'],
          waitFor: 2000
        }) as ScrapeResponse<any, never>;

        if (crawlResult.success && crawlResult.markdown) {
          const extractedArticles = this.parseScrapedContent(crawlResult.markdown, topic, searchUrl);
          articles.push(...extractedArticles);
        }

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
    if (!this.isEnabled || !this.openai) {
      console.log('Research service is disabled. Returning articles without embeddings.');
      return articles;
    }

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

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generating embedding for article ${article.id}:`, error);
      }
    }

    return articlesWithEmbeddings;
  }

  // Store research articles in Pinecone vector database
  async storeInVectorDB(articles: ResearchArticle[]): Promise<void> {
    if (!this.isEnabled || !this.pinecone) {
      console.log('Research service is disabled. Skipping storeInVectorDB.');
      return;
    }

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
    if (!this.isEnabled) {
      console.log('Research service is disabled. Returning true for hasKnowledgeGaps.');
      return true;
    }

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

  // Optimized search that prioritizes existing data
  async searchWithSmartScraping(query: string, topK: number = 3): Promise<any[]> {
    if (!this.isEnabled) {
      console.log('Research service is disabled. Returning empty results.');
      return [];
    }

    let existingMatches: any[] = [];
    
    try {
      // Always check existing knowledge first
      existingMatches = await this.searchRelevantResearch(query, topK);
      
      // Use stricter threshold to reduce unnecessary scraping
      const hasSignificantGaps = await this.hasKnowledgeGaps(query, 0.85);

      if (!hasSignificantGaps || existingMatches.length >= topK) {
        console.log('Using existing research data for query:', query);
        return existingMatches;
      }

      // Only scrape if we have very limited relevant data
      if (existingMatches.length < 2) {
        console.log('Limited data found, performing targeted scraping for:', query);
        await this.scrapeSpecificTopic(query);
        return await this.searchRelevantResearch(query, topK);
      }

      return existingMatches;
    } catch (error) {
      console.error('Error in smart search:', error);
      return existingMatches;
    }
  }

  // Scrape specific topic when knowledge gaps are detected
  async scrapeSpecificTopic(topic: string): Promise<void> {
    if (!this.isEnabled || !this.firecrawl) {
      console.log('Research service is disabled. Skipping scrapeSpecificTopic.');
      return;
    }

    try {
      const targetedSources = this.getTargetedSources(topic);
      
      for (const source of targetedSources) {
        try {
          const crawlResult = await this.firecrawl.scrapeUrl(source, {
            formats: ['markdown'],
            includeTags: ['article', 'main', 'div', 'section'],
            excludeTags: ['nav', 'footer', 'aside'],
            waitFor: 2000
          }) as ScrapeResponse<any, never>;

          if (crawlResult.success && crawlResult.markdown) {
            // Process the scraped content
            const articles = this.parseScrapedContent(crawlResult.markdown, topic, source);
            const articlesWithEmbeddings = await this.generateEmbeddings(articles);
            await this.storeInVectorDB(articlesWithEmbeddings);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error scraping source ${source}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error scraping topic ${topic}:`, error);
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
    if (!this.isEnabled || !this.openai || !this.pinecone) {
      console.log('Research service is disabled. Returning empty results.');
      return [];
    }

    try {
      // Generate embedding for the query
      const queryEmbeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding;
      if (!queryEmbedding) {
        console.error('Failed to generate embedding for query');
        return [];
      }

      // Search in Pinecone
      const index = this.pinecone.index(this.indexName);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      });

      if (!searchResponse || !searchResponse.matches) {
        console.error('No search results found');
        return [];
      }

      return searchResponse.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      }));
    } catch (error) {
      console.error('Error searching research:', error);
      return [];
    }
  }

  // Scrape and store research for core women's hormonal health topics only
  async initializeResearchDatabase(): Promise<void> {
    console.log('Initializing focused women\'s hormonal health research database...');
    
    const healthTopics = [
      // Reproductive system and health
      'female reproductive system anatomy function',
      'reproductive health women hormones',
      'menstrual cycle phases hormones',
      'ovulation women hormonal regulation',
      'fertility women hormonal health',
      'infertility women hormonal causes',
      'amenorrhea missing periods hormonal causes',
      'menstrual irregularities hormonal imbalance',
      'luteal phase defect hormonal causes',
      'follicular phase hormonal regulation',
      'ovarian reserve hormones',
      'egg quality hormones',
      'reproductive aging menopause hormones',
      // Hormone imbalance
      'hormone imbalance women symptoms causes',
      'estrogen dominance women',
      'progesterone deficiency women',
      'androgen excess women',
      'testosterone imbalance women',
      'FSH LH imbalance women',
      'prolactin imbalance women',
      'cortisol imbalance women',
      'insulin resistance women hormones',
      // PCOS/PCOD
      'PCOS polycystic ovary syndrome nutrition diet',
      'PCOS insulin resistance hormonal imbalance',
      'PCOS weight gain hormonal causes',
      'PCOS acne hirsutism androgen excess',
      'PCOS fertility ovulation',
      'PCOS treatment lifestyle nutrition',
      'PCOD polycystic ovarian disease hormonal imbalance',
      // Thyroid
      'thyroid disorders women hypothyroidism hyperthyroidism',
      'thyroid hormones menstrual cycle',
      'thyroid and fertility women',
      'thyroid and weight gain women',
      'thyroid and skin hair issues women',
      'hashimoto thyroiditis women',
      'graves disease women',
      // Weight gain (hormonal)
      'weight gain women hormonal causes',
      'insulin resistance weight gain women',
      'cortisol stress weight gain women',
      'hormonal weight gain menopause',
      // Acne, hirsutism, skin/hair (hormonal)
      'acne women hormonal causes',
      'hirsutism women androgen excess',
      'hair loss women hormonal imbalance',
      'skin changes women hormones',
      'seborrhea women hormones',
      // Other related
      'menstrual cramps dysmenorrhea hormones',
      'PMS premenstrual syndrome hormones',
      'PMDD premenstrual dysphoric disorder hormones',
      'ovarian cysts hormonal causes',
      'endometriosis hormonal regulation',
      'uterine fibroids hormones',
      'prolactinomas women',
      'adrenal disorders women hormones',
      'hormonal migraines women',
      'hormonal bone health women',
      'hormonal mood changes women',
      'hormonal sleep disturbances women',
    ];

    try {
      await this.initializeIndex();
      
      console.log(`Starting to scrape ${healthTopics.length} focused women's hormonal health topics...`);
      const articles = await this.scrapeHealthResearch(healthTopics);
      console.log(`Successfully scraped ${articles.length} research articles`);

      if (articles.length > 0) {
        const articlesWithEmbeddings = await this.generateEmbeddings(articles);
        console.log(`Generated embeddings for ${articlesWithEmbeddings.length} articles`);

        await this.storeInVectorDB(articlesWithEmbeddings);
        console.log('Focused women\'s hormonal health research database initialization complete');
      } else {
        console.log('No articles were scraped - please check Firecrawl API key and connection');
      }
    } catch (error) {
      console.error('Error initializing research database:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const researchService = new ResearchService();