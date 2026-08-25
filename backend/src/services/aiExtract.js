/**
 * aiExtract.js
 * Uses Google Gemini to extract structured MCQ questions from raw paper text.
 *
 * AI output is UNTRUSTED — always validate before storing.
 * API key is server-side only; never exposed to frontend.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Prompt template ─────────────────────────────────────────────────────────

/**
 * Build the extraction prompt.
 * @param {string} text     - Raw text extracted from the paper.
 * @param {object} metadata - Paper metadata { examName, stageName, year, language }
 */
function buildPrompt(text, metadata) {
  const { examName = 'MPSC Group C', stageName = 'Prelims', year, language = 'MARATHI' } = metadata;

  return `You are an expert at extracting Multiple Choice Questions (MCQs) from MPSC (Maharashtra Public Service Commission) exam papers.

The following text was extracted from the "${examName} — ${stageName} ${year || ''}" examination paper.
The primary language is ${language}.

Your task:
1. Extract ALL MCQ questions from the text.
2. Return ONLY a valid JSON array. No explanation, no markdown, no code block fences.
3. Each question object must follow this exact schema:

{
  "questionText": "Full question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  "correctAnswer": "A",
  "subject": "Indian Polity",
  "topic": "Indian Constitution",
  "difficulty": "MEDIUM",
  "language": "MARATHI",
  "explanation": "Brief explanation of the correct answer (optional, leave empty string if unknown)",
  "questionNumber": 1
}

Rules:
- "correctAnswer" must be exactly one of: "A", "B", "C", "D". If the answer key is not in the text, use null.
- "difficulty" must be exactly one of: "EASY", "MEDIUM", "HARD". Default to "MEDIUM" if unsure.
- "language" must be exactly one of: "MARATHI", "ENGLISH", "BILINGUAL". Detect from the question text.
- "subject" must be one of: History, Geography, Indian Polity, Economy, General Science, Current Affairs, Marathi, English, Mathematics, Reasoning. Best-guess based on content.
- If you cannot determine a field, use null for optional fields or a best-guess for required fields.
- Do NOT invent questions. Only extract questions that are actually present in the text.
- Preserve the original question and option text exactly, including Marathi/Devanagari script.
- Return an empty array [] if no MCQ questions can be found.

IMPORTANT: Return ONLY the raw JSON array. Start with [ and end with ]. No other text.

Paper text to extract from:
---
${text.slice(0, 15000)}
---`;
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Helper to call Gemini using candidate models with fallback.
 */
async function generateWithFallback(genAI, contentParts) {
  const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-pro-latest'];
  let lastError;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contentParts);
      return result.response.text();
    } catch (err) {
      console.warn(`[AI Extract] Model ${modelName} call failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All candidate Gemini models failed. Last error: ${lastError?.message}`);
}

/**
 * Extract structured MCQ questions from paper text using Gemini.
 * @param {object} payload - { text, isImage, imageBuffer, mimeType, metadata }
 * @returns {Promise<Array>} Raw AI-extracted question objects (not yet validated).
 */
async function extractQuestionsFromText(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to backend/.env to enable AI extraction.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let rawText;

  if (payload.isImage) {
    // Use Gemini Vision for image-based papers
    const imagePart = {
      inlineData: {
        data: payload.imageBuffer.toString('base64'),
        mimeType: payload.mimeType,
      },
    };
    const textPart = {
      text: `Extract all MCQ questions from this exam paper image. ${buildPrompt('[See attached image]', payload.metadata)}`,
    };
    rawText = await generateWithFallback(genAI, [textPart, imagePart]);
  } else {
    // Use text model for extracted document text
    const prompt = buildPrompt(payload.text, payload.metadata);
    rawText = await generateWithFallback(genAI, prompt);
  }

  // ─── Parse JSON response ────────────────────────────────────────────────────
  // Strip any accidental markdown fences
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (parseErr) {
    // Try to salvage a partial array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        questions = JSON.parse(match[0]);
      } catch {
        throw new Error(`AI returned invalid JSON. Parse error: ${parseErr.message}`);
      }
    } else {
      throw new Error(`AI returned invalid JSON. Raw response starts with: ${rawText.slice(0, 200)}`);
    }
  }

  if (!Array.isArray(questions)) {
    throw new Error('AI response was valid JSON but not an array of questions.');
  }

  return questions;
}

module.exports = { extractQuestionsFromText };
