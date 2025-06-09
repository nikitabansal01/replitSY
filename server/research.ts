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
    console.log('Initializing research database...');
    
    const healthTopics = [
      'menstrual cramps natural remedies',
      'PMS symptoms nutrition therapy',
      'hormonal acne diet treatment',
      'PCOS natural treatment diet',
      'endometriosis pain management nutrition',
      'menopause symptoms natural remedies',
      'thyroid health women nutrition',
      'iron deficiency anemia women',
      'bloating digestive health women',
      'mood swings hormonal balance'
    ];

    try {
      await this.initializeIndex();
      
      const articles = await this.scrapeHealthResearch(healthTopics);
      console.log(`Scraped ${articles.length} research articles`);

      if (articles.length > 0) {
        const articlesWithEmbeddings = await this.generateEmbeddings(articles);
        console.log(`Generated embeddings for ${articlesWithEmbeddings.length} articles`);

        await this.storeInVectorDB(articlesWithEmbeddings);
        console.log('Research database initialization complete');
      }
    } catch (error) {
      console.error('Error initializing research database:', error);
    }
  }
}

export const researchService = new ResearchService();