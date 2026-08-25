/**
 * pdfExtract.js
 * Extracts raw text from uploaded PDF, DOCX, DOC, or TXT files.
 * For image files, returns a sentinel so AI can use vision instead.
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

/**
 * Extract text from a stored file.
 * @param {string} filePath  - Absolute path to the stored file.
 * @param {string} mimeType  - MIME type of the file.
 * @returns {Promise<{ text: string|null, isImage: boolean }>}
 */
async function extractText(filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();

  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (imageTypes.includes(mimeType) || ['.jpg', '.jpeg', '.png'].includes(ext)) {
    // For images we'll pass the raw buffer to Gemini Vision
    const buffer = fs.readFileSync(filePath);
    return { text: null, isImage: true, imageBuffer: buffer, mimeType };
  }

  // Word Document (.docx / .doc)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ['.docx', '.doc'].includes(ext)
  ) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value || '';
      if (!text.trim()) {
        throw new Error('Word document appears to be empty.');
      }
      return { text: text.trim(), isImage: false };
    } catch (err) {
      throw new Error(`DOCX text extraction failed: ${err.message}`);
    }
  }

  // Plain Text (.txt)
  if (mimeType === 'text/plain' || ext === '.txt') {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      if (!text.trim()) {
        throw new Error('Text file is empty.');
      }
      return { text: text.trim(), isImage: false };
    } catch (err) {
      throw new Error(`TXT reading failed: ${err.message}`);
    }
  }

  // PDF
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text || '';

    if (!text.trim()) {
      throw new Error('PDF appears to be empty or image-based (no extractable text layer).');
    }

    return { text: text.trim(), isImage: false };
  } catch (err) {
    throw new Error(`PDF text extraction failed: ${err.message}`);
  }
}

module.exports = { extractText };
