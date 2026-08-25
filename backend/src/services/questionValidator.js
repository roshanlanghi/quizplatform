/**
 * questionValidator.js
 * Validates a single AI-extracted question object before DB storage.
 *
 * AI output is UNTRUSTED. This is the gate before anything touches the database.
 */

const VALID_OPTIONS = ['A', 'B', 'C', 'D'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const VALID_LANGUAGES = ['MARATHI', 'ENGLISH', 'BILINGUAL'];

// Normalize difficulty
function normalizeDifficulty(d) {
  if (!d) return 'MEDIUM';
  const upper = String(d).toUpperCase();
  return VALID_DIFFICULTIES.includes(upper) ? upper : 'MEDIUM';
}

// Normalize language
function normalizeLanguage(l) {
  if (!l) return 'MARATHI';
  const upper = String(l).toUpperCase();
  return VALID_LANGUAGES.includes(upper) ? upper : 'MARATHI';
}

// Normalize options object (maps numeric keys 1,2,3,4, lowercase a,b,c,d, or arrays to A,B,C,D)
function normalizeOptions(options) {
  if (!options) return null;
  const result = { A: '', B: '', C: '', D: '' };

  if (Array.isArray(options)) {
    if (options[0]) result.A = String(options[0]).trim();
    if (options[1]) result.B = String(options[1]).trim();
    if (options[2]) result.C = String(options[2]).trim();
    if (options[3]) result.D = String(options[3]).trim();
    return result;
  }

  if (typeof options === 'object') {
    // Check direct keys first
    const getKey = (keys) => {
      for (const k of keys) {
        if (options[k] !== undefined && options[k] !== null && String(options[k]).trim()) {
          return String(options[k]).trim();
        }
      }
      return '';
    };

    result.A = getKey(['A', 'a', '1', '(1)', '1)']);
    result.B = getKey(['B', 'b', '2', '(2)', '2)']);
    result.C = getKey(['C', 'c', '3', '(3)', '3)']);
    result.D = getKey(['D', 'd', '4', '(4)', '4)']);
  }

  return result;
}

// Normalize correct answer (maps 1/2/3/4, a/b/c/d to A/B/C/D)
function normalizeCorrectAnswer(ca) {
  if (!ca) return null;
  const str = String(ca).trim().toUpperCase();
  if (VALID_OPTIONS.includes(str)) return str;

  const map = {
    '1': 'A', '(1)': 'A', '1)': 'A', 'A': 'A', 'A)': 'A',
    '2': 'B', '(2)': 'B', '2)': 'B', 'B': 'B', 'B)': 'B',
    '3': 'C', '(3)': 'C', '3)': 'C', 'C': 'C', 'C)': 'C',
    '4': 'D', '(4)': 'D', '4)': 'D', 'D': 'D', 'D)': 'D',
  };
  return map[str] || null;
}

/**
 * Validate and normalize a single extracted question.
 * @param {object} raw - Raw AI-extracted question object.
 * @returns {{ valid: boolean, errors: string[], normalized: object|null }}
 */
function validateExtractedQuestion(raw) {
  const errors = [];

  // ── Required: questionText ─────────────────────────────────────────────────
  if (!raw.questionText || typeof raw.questionText !== 'string' || !raw.questionText.trim()) {
    errors.push('questionText is missing or empty');
  }

  // ── Required: options ──────────────────────────────────────────────────────
  const normalizedOpts = normalizeOptions(raw.options);
  if (!normalizedOpts) {
    errors.push('options object is missing');
  } else {
    for (const key of VALID_OPTIONS) {
      if (!normalizedOpts[key]) {
        errors.push(`Option ${key} is missing or empty`);
      }
    }
  }

  // ── Correct answer (nullable — may not be available without answer key) ────
  const correctAnswer = normalizeCorrectAnswer(raw.correctAnswer);

  if (errors.length > 0) {
    return { valid: false, errors, normalized: null };
  }

  // ── Build normalized question ──────────────────────────────────────────────
  const normalized = {
    questionText: String(raw.questionText).trim(),
    options: normalizedOpts,
    correctAnswer,
    subject: raw.subject ? String(raw.subject).trim() : null,
    topic: raw.topic ? String(raw.topic).trim() : null,
    difficulty: normalizeDifficulty(raw.difficulty),
    language: normalizeLanguage(raw.language),
    explanation: raw.explanation ? String(raw.explanation).trim() : null,
    questionNumber: typeof raw.questionNumber === 'number' ? raw.questionNumber : null,
  };

  return { valid: true, errors: [], normalized };
}

/**
 * Validate a batch of raw questions.
 * @param {Array} rawQuestions
 * @returns {{ valid: object[], invalid: Array<{ raw, errors }> }}
 */
function validateBatch(rawQuestions) {
  const valid = [];
  const invalid = [];

  for (const raw of rawQuestions) {
    const result = validateExtractedQuestion(raw);
    if (result.valid) {
      valid.push(result.normalized);
    } else {
      invalid.push({ raw, errors: result.errors });
    }
  }

  return { valid, invalid };
}

module.exports = { validateExtractedQuestion, validateBatch };
