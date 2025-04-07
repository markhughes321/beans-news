const logger = require("../../config/logger");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processArticleAI({ title, description, imageUrl }) {
  logger.debug("Starting AI processing for article", { title });

  try {
    const prompt = `
    You are analyzing a coffee news article and must produce strict JSON:
    {
      "category": (exactly one from ["Sustainability","Design","Origin","Culture","Market","Innovation","People","Competition"]),
      "geotag": (a single real country name if found, else null),
      "tags": (an array of up to two relevant tags (people/cafe/roastery/company), or null if none),
      "improvedDescription": (a short summary, up to 300 words, no dashes, must end with a period),
      "seoDescription": (a unique, clear, and concise SEO description, maximum 150 characters, no dashes)
    }

    Title: "${title}"
    Description: "${description}"
    Image: "${imageUrl}"
    Return ONLY valid JSON, nothing else.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You strictly output JSON with the required fields." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content;
    logger.debug("Received AI response", { title });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      logger.error("Failed to parse OpenAI JSON response", { title, raw, error: err.message });
      return {
        category: "Market",
        geotag: null,
        tags: null,
        improvedDescription: description || "",
        seoTitle: `${title} | Beans NEWS`,
        seoDescription: description ? description.substring(0, 150) : "",
      };
    }

    const validCategories = [
      "Sustainability", "Design", "Origin", "Culture", "Market", "Innovation", "People", "Competition",
    ];
    if (!validCategories.includes(parsed.category)) {
      parsed.category = "Market";
    }

    if (parsed.improvedDescription && !parsed.improvedDescription.trim().endsWith(".")) {
      parsed.improvedDescription += ".";
    }

    if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) {
      parsed.tags = null;
    }

    let seoDesc = parsed.seoDescription || (description ? description.substring(0, 150) : "");
    if (seoDesc.length > 150) {
      seoDesc = seoDesc.substring(0, 147) + "...";
    }

    logger.info("AI processing completed", { title, category: parsed.category });
    return {
      category: parsed.category,
      geotag: parsed.geotag || null,
      tags: parsed.tags,
      improvedDescription: parsed.improvedDescription || (description || ""),
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
      seoDescription: description ? description.substring(0, 150) : "",
    };
  }
}

module.exports = { processArticleAI };