const { OpenAI } = require('openai');
const logger = require('../config/logger');
const Article = require('../models/Article');

// Initialize OpenAI client with built-in retry logic
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY is not defined in the environment variables');
  throw new Error('OPENAI_API_KEY is required');
}

const predefinedCategories = [
  {
    name: "Sustainability",
    description: "Stories that explore ethical sourcing, environmental practices, regenerative farming, and the future of responsible coffee production. Articles highlight initiatives around organic agriculture, carbon neutrality, traceability, packaging innovation, and efforts to improve working conditions at origin."
  },
  {
    name: "Design",
    description: "Features on branding, café interiors, packaging, and the aesthetics of the coffee experience. From café architecture and equipment design to visual identity and product presentation, this category showcases the creativity shaping how we interact with coffee."
  },
  {
    name: "Origin",
    description: "Deep dives into coffee-producing regions around the world and the unique terroir behind every cup. Expect profiles on farmers, varieties, processing methods, and stories that connect drinkers to the people and landscapes behind the beans."
  },
  {
    name: "Culture",
    description: "Insights into the social, historical, and everyday rituals that define the global coffee community. This category captures coffee as a cultural force, from traditional brewing methods to modern café movements and how coffee fits into broader societal trends."
  },
  {
    name: "Market",
    description: "News and analysis on the business of coffee, retail trends, brand launches, pricing, and industry movements. Covering everything from café chains to eCommerce shifts, mergers, and consumer buying behavior."
  },
  {
    name: "Innovation",
    description: "Articles exploring the cutting edge of coffee, from new technology to experimental processes and gear. This includes features on smart brewers, sustainable tech, fermentation techniques, data-driven roasting, and emerging coffee science."
  },
  {
    name: "People",
    description: "Personal stories, interviews, and profiles of the individuals driving the coffee world forward. Roasters, producers, baristas, researchers, and community leaders, spotlighting the people whose passion and work shape the industry."
  },
  {
    name: "Competition",
    description: "Reports and recaps from barista championships, Cup of Excellence events, and brewing contests around the world. Coverage includes winners, routines, featured coffees, judging trends, and insights from the competitive coffee circuit."
  }
];

/**
 * Analyzes an article using ChatGPT and assigns category, geotag, tags, and improves description.
 * @param {Object} article - The article to analyze.
 * @returns {Promise<Object>} The analysis result.
 */
async function analyzeArticle(article) {
  // Skip if ChatGPT is disabled
  if (process.env.ENABLE_CHATGPT !== 'true') {
    logger.info(`ChatGPT analysis disabled for article ${article._id}`);
    return {
      id: article._id.toString(),
      category: 'Culture',
      geotag: null,
      tags: null,
      description_improved: article.description || 'No description available.',
    };
  }

  try {
    const prompt = `
You are a system that analyzes coffee-related articles. For the article provided, follow these steps:

1. **Category**:
   - Assign exactly one category from this predefined list: ${predefinedCategories.map(cat => cat.name).join(', ')}.
   - Analyze the title and description to determine the best fit. Use the category descriptions below to guide your decision:
     ${predefinedCategories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n')}
   - The category cannot be null.

2. **Geotag**:
   - If the title or description explicitly mentions a geographic location (e.g., a city or country), assign the most specific single-word location as "geotag". For example:
     - "Rochester, New York" or "New York, Rochester" should be "New York".
     - "Dar es Salaam" should be "Dar Es Salaam".
   - Convert the geotag to Title Case (e.g., "new york" becomes "New York", "dar es salaam" becomes "Dar Es Salaam").
   - If no clear geographic location is mentioned, set "geotag" to null.

3. **Tags**:
   - Identify up to two names (people, cafes, roasteries) in the title or description.
   - Do not include two tags of the same type (e.g., two people, two cafes, or two roasteries). If two names are of the same type, keep only the first one.
   - Convert all tags to Title Case (e.g., "LAUREL CARMICHAEL" becomes "Laurel Carmichael").
   - Return them in a list of up to 2 items. If none are found, set to null.
   - Ensure all tags are non-empty strings; do not include null or empty values in the array.

4. **Improved Description**:
   - Create an excerpt of the original description, limiting it to 300 words.
   - Preserve the original tone and intent of the description.
   - Do not exceed 300 words.
   - Do not use any em-dashes or dashes.
   - Always end with a period.
   - If the description is shorter than 300 words, use the full description.

5. **Output Format**:
   - Return a single JSON object with these fields.
   - Ensure the JSON is valid: all property names must be double-quoted, all string values must be properly escaped, and there must be no trailing commas.
   - Do not wrap the JSON in Markdown code blocks (e.g., \`\`\`json). Output only the raw JSON string:
   {
     "id": "${article._id.toString()}",
     "category": string,
     "geotag": string or null,
     "tags": array of up to 2 strings or null,
     "description_improved": string
   }

### Article to Analyze

Title: ${article.title}

Description: ${article.description || 'No description available.'}
`;

    logger.debug(`Sending ChatGPT request for article ${article._id}`);
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a precise and efficient analyzer of coffee-related articles. Always return valid JSON with double-quoted property names, properly escaped strings, and no trailing commas.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Attempt to fix common JSON issues
      let fixedContent = content
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/\\(?![\\nrtbf'"])/g, '\\\\')
        .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"');

      fixedContent = fixedContent
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

      try {
        result = JSON.parse(fixedContent);
      } catch (fixError) {
        logger.error(`Failed to fix ChatGPT response for article ${article._id}: ${fixedContent}`);
        throw new Error(`Invalid JSON response from ChatGPT: ${parseError.message}`);
      }
    }

    logger.debug(`ChatGPT analysis for article ${article._id}: ${JSON.stringify(result)}`);

    // Validate the response
    if (!result.id || result.id !== article._id.toString()) {
      throw new Error(`Invalid ID in ChatGPT response: expected ${article._id}, got ${result.id}`);
    }

    if (!result.category || !predefinedCategories.some(cat => cat.name === result.category)) {
      throw new Error(`Invalid category returned by ChatGPT: ${result.category}`);
    }

    // Validate and clean tags
    let tags = result.tags;
    if (tags) {
      if (!Array.isArray(tags) || tags.length > 2 || tags.some(tag => typeof tag !== 'string' || tag.trim() === '')) {
        throw new Error(`Invalid tags returned by ChatGPT: ${JSON.stringify(tags)}`);
      }
      tags = tags
        .filter(tag => typeof tag === 'string' && tag.trim() !== '')
        .map(tag => tag.trim());
      if (tags.length === 0) {
        tags = null;
      }
    }

    if (!result.description_improved || typeof result.description_improved !== 'string' || result.description_improved.trim() === '') {
      throw new Error('Invalid improved description returned by ChatGPT');
    }

    // Update metaStatus to 'success'
    const updateResult = await Article.updateOne(
      { _id: article._id },
      { metaStatus: 'success' }
    );
    if (updateResult.matchedCount === 0) {
      logger.warn(`Failed to update metaStatus for article ${article._id}: No matching document found`);
    } else if (updateResult.modifiedCount === 0) {
      logger.warn(`metaStatus for article ${article._id} was not modified (already 'success'?)`);
    } else {
      logger.info(`Updated metaStatus to 'success' for article ${article._id}`);
    }

    return {
      id: result.id,
      category: result.category,
      geotag: result.geotag,
      tags: tags,
      description_improved: result.description_improved,
    };
  } catch (error) {
    logger.error(`Error analyzing article with ChatGPT (${article._id}): ${error.message}`);
    // Update metaStatus to 'failed'
    const updateResult = await Article.updateOne(
      { _id: article._id },
      { metaStatus: 'failed' }
    );
    if (updateResult.matchedCount === 0) {
      logger.warn(`Failed to update metaStatus to 'failed' for article ${article._id}: No matching document found`);
    } else {
      logger.info(`Updated metaStatus to 'failed' for article ${article._id}`);
    }
    throw error;
  }
}

/**
 * Batch analyzes articles using ChatGPT.
 * @param {Array<Object>} articles - Array of articles to analyze.
 * @returns {Promise<Array<Object>>} Array of analysis results.
 */
async function batchAnalyzeArticles(articles) {
  const results = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(article => analyzeArticle(article));
    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.warn(`Failed to analyze article ${batch[index]._id} with ChatGPT: ${result.reason.message}`);
        // Fallback: Assign default values
        results.push({
          id: batch[index]._id.toString(),
          category: 'Culture',
          geotag: null,
          tags: null,
          description_improved: batch[index].description || 'No description available.',
        });
      }
    });
  }

  return results;
}

module.exports = { analyzeArticle, batchAnalyzeArticles };