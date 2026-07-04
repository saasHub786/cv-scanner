const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * CV Parser Service
 * Extracts text from PDF and DOCX files
 * Supports both formats with robust error handling
 */
class CVParser {
  /**
   * Extract text from a CV file
   * @param {string} filePath - Path to uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} - Extracted text content
   */
  async extractText(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found.');
    }

    try {
      if (mimeType === 'application/pdf') {
        return await this._parsePDF(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this._parseDOCX(filePath);
      } else {
        throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
      }
    } catch (error) {
      throw new Error(`Failed to parse CV: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async _parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images (scanned PDF without OCR).');
    }

    return data.text;
  }

  /**
   * Extract text from DOCX
   */
  async _parseDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX file appears to be empty.');
    }

    return result.value;
  }

  /**
   * Clean up uploaded file
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to clean up file:', error.message);
    }
  }
}

module.exports = new CVParser();
