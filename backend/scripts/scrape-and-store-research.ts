import FirecrawlApp from '@mendable/firecrawl-js';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const indexName = 'health-research';
const topics = [
  // 1. Food ingredients for symptoms
  'food ingredients for hormonal acne',
  'food ingredients for hirsutism',
  'food ingredients for hair loss',
  'food ingredients for bloating',
  'food ingredients for nausea',
  'food ingredients for irregular periods',
  'food ingredients for sudden weight gain',
  'food ingredients for metabolism damage',
  'food ingredients for insulin resistance',

  // 2. Physical movement for symptoms
  'cardio for hormonal health',
  'strength training for hormonal health',
  'yoga for hormonal health',
  'physical movement for bloating, nausea, irregular periods, weight gain, metabolism, insulin resistance',

  // 3. Alternative therapies
  'alternative therapies for hormonal health',
  'alternative therapies for emotional healing in women',
  'alternative therapies for PCOS, PCOD, and related symptoms',

  // 4. Cycle syncing
  'cycle syncing for women',
  'cycle syncing and hormone rhythms',

  // 5. PCOS/PCOD triggers
  'triggers that make PCOS symptoms worse',
  'triggers that make PCOD symptoms worse',

  // 6. Ethnicity and PCOS/PCOD
  'ethnicity and PCOS symptoms',
  'ethnicity and PCOD symptoms',
  'PCOS symptoms across populations',

  // 7. Functional foods for PCOS/PCOD
  'functional foods for PCOS management',
  'functional foods for PCOD management',
];

async function ensureIndex() {
  const indexList = await pinecone.listIndexes();
  if (!indexList.indexes?.some(index => index.name === indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
    });
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

async function scrapeAndStore() {
  await ensureIndex();
  const index = pinecone.index(indexName);

  for (const topic of topics) {
    const searchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(topic)}`;
    console.log(`Scraping: ${searchUrl}`);
    const crawlResult = await firecrawl.scrapeUrl(searchUrl, {
      formats: ['markdown'],
      includeTags: ['article', 'main', 'div'],
      excludeTags: ['nav', 'footer', 'aside'],
      waitFor: 2000
    });

    if (crawlResult.success && crawlResult.markdown) {
      const sections = crawlResult.markdown.split(/\n\n+/);
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length > 100 && /(Abstract|PMID|DOI|Journal)/.test(section)) {
          // Get embedding
          const embeddingResp = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: section,
          });
          const embedding = embeddingResp.data[0]?.embedding;
          if (!embedding) continue;

          // Store in Pinecone
          await index.upsert([{
            id: `research_${Date.now()}_${i}`,
            values: embedding,
            metadata: {
              title: section.slice(0, 80),
              content: section.slice(0, 1000),
              url: searchUrl,
              source: 'PubMed',
              topics: topic,
              publishedDate: new Date().toISOString()
            }
          }]);
          console.log(`Stored article for topic: ${topic}`);
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('All topics scraped and stored!');
}

scrapeAndStore().catch(console.error); 