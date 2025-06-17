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

  // Scrape and store research for common women's health topics
  async initializeResearchDatabase(): Promise<void> {
    console.log('Initializing comprehensive women\'s health research database...');
    
    const healthTopics = [
      // PCOS comprehensive topics
      'PCOS polycystic ovary syndrome nutrition diet anti-inflammatory',
      'PCOS insulin resistance myo-inositol D-chiro-inositol clinical studies',
      'PCOS weight management chromium berberine metformin alternatives',
      'PCOS hormonal balance spearmint tea anti-androgen effects',
      'PCOS fertility natural conception omega-3 CoQ10',
      'PCOS lean type normal weight treatment nutrition',
      'PCOS inflammatory type diet turmeric omega-3',
      'PCOS insulin resistant type low glycemic diet',
      'PCOS post-pill type hormonal recovery nutrition',
      'PCOS polycystic ovary syndrome nutrition diet anti-inflammatory',
      'PCOS insulin resistance myo-inositol D-chiro-inositol clinical studies',
      'PCOS weight management chromium berberine metformin alternatives',
      'PCOS hormonal balance spearmint tea anti-androgen effects',
      'PCOS fertility natural conception omega-3 CoQ10',
      'PCOS lean type normal weight treatment nutrition',
      'PCOS inflammatory type diet turmeric omega-3',
      'PCOS insulin resistant type low glycemic diet',
      'PCOS post-pill type hormonal recovery nutrition',

  // Research and clinical studies
      'PCOS PCOD clinical studies with women diagnosed',
      'Research on food ingredients for hormonal acne hirsutism hairloss bloating nausea irregular periods weight gain metabolism insulin resistance',
      'Research on physical movement for PCOS: cardio strength yoga for acne hirsutism bloating nausea irregular periods metabolism insulin',
      'Alternative therapies for PCOS: emotional healing for acne hirsutism hairloss bloating irregular periods weight gain',
      'Cycle syncing and natural hormone rhythms in women',
      'Triggers that worsen PCOS PCOD symptoms: stress sugar dairy gluten overexercise under-eating',
      'Ethnicity and PCOS PCOD prevalence treatment responses',
      'Functional foods for PCOS PCOD: flaxseed turmeric spearmint cinnamon inositol zinc omega-3',
      
      // Thyroid comprehensive topics
      'hypothyroidism women nutrition selenium iodine zinc',
      'hashimoto thyroid autoimmune diet gluten-free AIP',
      'hyperthyroidism graves disease nutrition management',
      'thyroid nodules diet iodine restriction nutrition',
      'subclinical hypothyroidism TSH levels nutrition intervention',
      'thyroid medication food interactions timing absorption',
      'thyroid function vitamin D B12 iron deficiency connection',
      'postpartum thyroiditis nutrition recovery treatment',
      'thyroid hormone conversion T4 T3 selenium zinc',
      
      // Endometriosis detailed research
      'endometriosis pain management anti-inflammatory diet omega-3',
      'endometriosis iron deficiency anemia nutrition supplementation',
      'endometriosis hormonal therapy natural alternatives',
      'endometriosis fertility preservation nutrition CoQ10',
      'endometriosis digestive symptoms IBS connection nutrition',
      'endometriosis estrogen dominance detox nutrition',
      'endometriosis surgical recovery nutrition healing',
      
      // Digestive health specific to women
      'women digestive health bloating hormonal connection menstrual cycle',
      'SIBO small intestinal bacterial overgrowth women treatment',
      'IBS irritable bowel syndrome women hormonal triggers',
      'constipation women hormonal causes magnesium fiber',
      'acid reflux GERD women pregnancy menopause',
      'gut microbiome women hormones estrogen progesterone',
      'leaky gut syndrome women autoimmune connection',
      
      // Hormonal balance and cycles
      'menstrual cramps dysmenorrhea magnesium omega-3 natural relief',
      'heavy menstrual bleeding iron B vitamins nutrition',
      'irregular periods PCOS thyroid nutrition hormonal balance',
      'PMS premenstrual syndrome magnesium B6 calcium',
      'PMDD premenstrual dysphoric disorder nutrition serotonin',
      'amenorrhea missing periods nutrition weight restoration',
      'ovulation nutrition fertility signs tracking',
      
      // Seed cycling comprehensive research
      'seed cycling menstrual cycle hormonal balance flax pumpkin sesame sunflower',
      'flax seeds lignans estrogen metabolism follicular phase clinical studies',
      'pumpkin seeds zinc hormone production progesterone support',
      'sesame seeds lignans progesterone support luteal phase research',
      'sunflower seeds vitamin E hormone balance menstrual cycle',
      'seed cycling PCOS hormonal imbalance natural treatment',
      'menstrual cycle phases nutrition follicular luteal ovulation',
      'hormone support foods estrogen progesterone natural balance',
      'seed cycling clinical evidence scientific research women health',
      'phytoestrogens seeds nuts hormonal balance menstruation',
      'essential fatty acids omega-3 omega-6 menstrual health',
      'seed cycling endometriosis pain management hormonal support',
      'natural hormone therapy seeds nuts menopause perimenopause',
      
      // Stress and adrenal health
      'chronic stress cortisol women adrenal fatigue nutrition',
      'adaptogens ashwagandha rhodiola holy basil women stress',
      'adrenal insufficiency women nutrition mineral support',
      'stress eating emotional eating women hormonal triggers',
      'sleep disorders women hormones melatonin magnesium',
      'anxiety women hormonal connection GABA nutrients',
      
      // Reproductive and fertility
      'fertility nutrition preconception health folate omega-3 CoQ10',
      'infertility women nutritional deficiencies testing',
      'miscarriage prevention nutrition folic acid progesterone',
      'egg quality nutrition antioxidants CoQ10 resveratrol',
      'sperm health partner nutrition zinc selenium vitamin C',
      'IVF nutrition support pre-during transfer',
      'postpartum nutrition breastfeeding recovery depletion',
      
      // Menopause and aging
      'menopause symptoms nutrition phytoestrogens isoflavones',
      'perimenopause nutrition hormone fluctuations management',
      'postmenopausal bone health calcium magnesium vitamin D K2',
      'menopause weight gain metabolism nutrition strategies',
      'hot flashes natural treatment black cohosh nutrition',
      'menopause mood changes serotonin nutrition support',
      'hormone replacement therapy nutrition interactions',
      
      // Autoimmune conditions in women
      'autoimmune diseases women nutrition AIP diet',
      'lupus women nutrition anti-inflammatory omega-3',
      'rheumatoid arthritis women nutrition turmeric',
      'celiac disease women nutrition gluten-free healing',
      'inflammatory bowel disease women nutrition healing',
      'multiple sclerosis women nutrition vitamin D omega-3',
      
      // Skin and hair health
      'hormonal acne women nutrition zinc omega-3 probiotics',
      'hair loss women iron deficiency biotin nutrition',
      'melasma women nutrition antioxidants vitamin C',
      'eczema women hormonal triggers nutrition healing',
      'rosacea women nutrition triggers anti-inflammatory',
      
      // Mental health and nutrition
      'depression women hormonal connection omega-3 B vitamins',
      'anxiety women nutrition magnesium GABA amino acids',
      'bipolar disorder women nutrition lithium omega-3',
      'eating disorders women nutrition recovery healing',
      'seasonal affective disorder women vitamin D',
      
      // Cancer prevention and nutrition
      'breast cancer prevention nutrition cruciferous vegetables',
      'ovarian cancer prevention nutrition antioxidants',
      'cervical cancer prevention nutrition folate vitamin C',
      'endometrial cancer prevention nutrition fiber phytoestrogens',
      
      // Metabolic health
      'insulin resistance women nutrition chromium cinnamon',
      'diabetes type 2 women nutrition prevention management',
      'metabolic syndrome women nutrition omega-3 fiber',
      'obesity women hormonal causes nutrition strategies',
      'fatty liver disease women nutrition choline',
      
      // Bone and joint health
      'osteoporosis women nutrition calcium magnesium vitamin D K2',
      'osteopenia women nutrition prevention bone building',
      'joint pain women inflammation nutrition omega-3',
      'fibromyalgia women nutrition magnesium B vitamins',
      'chronic fatigue syndrome women nutrition mitochondrial support'
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

// Export a singleton instance
export const researchService = new ResearchService();