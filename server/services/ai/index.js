const logger = require("../../config/logger");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the JSON schema for Structured Outputs
const articleSchema = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: [
        "Sustainability",
        "Design",
        "Origin",
        "Culture",
        "Market",
        "Innovation",
        "People",
        "Competition",
      ],
      description: "The category of the article, must be one of the specified values.",
    },
    geotag: {
      type: ["string", "null"],
      description: "A single real country name if found, else null.",
    },
    tags: {
      type: ["array", "null"],
      items: {
        type: "string",
        description: "A relevant tag (e.g., people, cafe, roastery, company).",
      },
      description: "An array of up to two relevant tags, or null if none.",
    },
    improvedDescription: {
      type: "string",
      description: "A short summary of the article, up to 300 words, must end with a period.",
    },
    seoDescription: {
      type: "string",
      description: "A unique, clear, and concise SEO description, maximum 150 characters, no dashes.",
    },
  },
  required: ["category", "geotag", "tags", "improvedDescription", "seoDescription"],
  additionalProperties: false,
};

async function processArticleAI({ title, description, imageUrl }) {
  logger.debug("Starting AI processing for article", { title });

  try {
    const prompt = `
    You are analyzing a coffee news article. Extract and generate the following information based on the provided schema:
    
    - category: Classify the article into exactly one of these categories: Sustainability, Design, Origin, Culture, Market, Innovation, People, Competition.
    
    - geotag: A **single official country name**, in Title Case (e.g., "Brazil", "United Kingdom"). 
      Do **not** include states, regions, provinces, cities, counties, or territories. 
      Return null if no country is clearly mentioned.
      Acceptable examples: "United States", "Colombia", "Ireland", "Peru"
      Unacceptable examples: "California", "Kintamani", "Scotland", "Europe", "Latin America"
    
    - tags: Provide up to two relevant tags (title case only). Tags should refer to:
      1. **People** (e.g., James Hoffmann)
      2. **Cafes** (e.g., Origin, April Coffee)
      3. **Roasteries** (e.g., Tim Wendelboe, Onyx, Black & White)
      4. **Companies** (e.g., La Marzocco, Hario, SCA)
    
      Rules:
      - Tags must be in **Title Case** (e.g., “James Hoffmann”, not “james hoffmann” or “JAMES HOFFMANN”).
      - Tags must be **unique** (no duplicates).
      - A maximum of **2 tags**. It is acceptable to return **1 tag** or **null** if no meaningful tags apply.
      - Only include a tag if it is clearly **mentioned or directly implied** in the article and adds value.
      - Avoid generic terms like "coffee", "business", or "origin" as tags.
    
      Example:
      If the article mentions Tim Wendelboe’s roastery in Oslo and discusses La Marzocco’s new machine, the correct tags would be:
      ["Tim Wendelboe", "La Marzocco"]
    
    - improvedDescription: Write a short, refined excerpt or direct statement based on the article. 
      Do **not** summarize. Instead, extract a sentence or passage and enhance it slightly for clarity and tone.
      Rules:
      - Must read like a natural sentence.
      - Must be no more than **300 characters**.
      - Must **end with a full stop**.
      - Avoid generic phrases like "The article discusses..." or "This article is about..."
    
      Examples:
      ✓ “Producers are now openly sharing their fermentation techniques to create more transparent, traceable coffee.”
      ✓ “April Coffee’s new roastery blends minimalist design with a clear focus on quality and education.”
      ✗ “This article discusses the importance of transparency in coffee processing.”
    
    - seoDescription: Create a unique, clear, and concise SEO description (maximum 150 characters, no dashes).
    
    Title: "${title}"
    Description: "${description}"
    Image: "${imageUrl}"
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Use a model that supports Structured Outputs
      messages: [
        { role: "system", content: "You are a helpful assistant that processes coffee news articles." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "article_processing",
          schema: articleSchema,
          strict: true, // Enforce strict schema adherence
        },
      },
    });

    const result = response.choices[0].message.content;
    logger.debug("Received AI response", { title, result });

    // Since Structured Outputs guarantees the response matches the schema, we can parse it directly
    const parsed = JSON.parse(result);

    // Handle refusals
    if (response.choices[0].message.refusal) {
      logger.warn("OpenAI refused to process the article", { title, refusal: response.choices[0].message.refusal });
      throw new Error(`OpenAI refused to process the article: ${response.choices[0].message.refusal}`);
    }

    // Post-process fields that can't be enforced by the schema
    let improvedDescription = parsed.improvedDescription;
    if (!improvedDescription.trim().endsWith(".")) {
      improvedDescription += ".";
    }

    let seoDesc = parsed.seoDescription;
    if (seoDesc.length > 150) {
      seoDesc = seoDesc.substring(0, 147) + "...";
    }
    seoDesc = seoDesc.replace(/-/g, " "); // Replace dashes with spaces

    logger.info("AI processing completed", { title, category: parsed.category });
    return {
      category: parsed.category,
      geotag: parsed.geotag,
      tags: parsed.tags,
      improvedDescription,
      seoTitle: `${title} | Beans NEWS`,
      seoDescription: seoDesc,
    };
  } catch (err) {
    logger.error("OpenAI processing error", { title, error: err.message });
    return {
      category: "Market",
      geotag: null,
      tags: null,
      improvedDescription: description || "",
      seoTitle: `${title} | Beans NEWS`,
      seoDescription: description ? description.substring(0, 150).replace(/-/g, " ") : "",
    };
  }
}

module.exports = { processArticleAI };