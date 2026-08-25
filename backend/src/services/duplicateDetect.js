/**
 * duplicateDetect.js
 * Checks whether a question with the same normalized text already exists in the DB.
 *
 * Uses case-insensitive exact match via Prisma.
 * Future enhancement: semantic similarity / embeddings.
 */

const prisma = require('../lib/prisma');

/**
 * Normalize question text for comparison.
 * Strips extra whitespace, lowercases, removes common punctuation.
 * @param {string} text
 * @returns {string}
 */
function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[।,;:!?()\[\]""'']/g, '')
    .trim();
}

/**
 * Check if a question text already exists in the DB.
 * @param {string} questionText - The normalized question text to check.
 * @returns {Promise<{ isDuplicate: boolean, existingId: string|null }>}
 */
async function isDuplicate(questionText) {
  const existing = await prisma.question.findFirst({
    where: {
      questionText: {
        equals: questionText.trim(),
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  return {
    isDuplicate: !!existing,
    existingId: existing?.id ?? null,
  };
}

/**
 * Filter a batch of validated questions to remove duplicates.
 * @param {Array<object>} validQuestions - Already validated + normalized questions.
 * @returns {Promise<{ unique: object[], duplicates: object[] }>}
 */
async function filterDuplicates(validQuestions) {
  const unique = [];
  const duplicates = [];

  for (const q of validQuestions) {
    const { isDuplicate: dupe, existingId } = await isDuplicate(q.questionText);
    if (dupe) {
      duplicates.push({ question: q, existingId });
    } else {
      unique.push(q);
    }
  }

  return { unique, duplicates };
}

module.exports = { isDuplicate, filterDuplicates, normalizeForComparison };
