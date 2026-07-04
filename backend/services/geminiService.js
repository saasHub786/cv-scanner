const { getGeminiModel } = require('../config/gemini');

/**
 * Gemini AI Service
 * Handles all LLM interactions for CV scanning
 * Free tier: 1500 requests/day, 60 requests/minute with Gemini 1.5 Flash
 */
class GeminiService {
  /**
   * Score a CV against a job description
   * @param {string} cvText - Extracted text from CV
   * @param {string} jobTitle - Job title
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} - Structured analysis result
   */
  async analyzeCandidate(cvText, jobTitle, jobDescription) {
    try {
      const model = getGeminiModel();

      const prompt = this._buildAnalysisPrompt(cvText, jobTitle, jobDescription);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this._parseResponse(text);
    } catch (error) {
      console.error('Gemini API error:', error.message);

      // Handle quota limits gracefully
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('API quota reached. Please try again later or upgrade your API plan.');
      }
      if (error.message.includes('SAFETY') || error.message.includes('blocked')) {
        throw new Error('Content was blocked by safety filters. Please check the CV content.');
      }

      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate interview questions based on CV and job match
   * @param {Object} candidateData - The scan result data
   * @returns {Promise<string[]>} - Array of interview questions
   */
  async generateInterviewQuestions(candidateData) {
    try {
      const model = getGeminiModel();

      const prompt = `You are an expert HR interviewer and technical recruiter.

Based on the following candidate analysis, generate **8 targeted interview questions**:

## Candidate Details
- **Name**: ${candidateData.candidate_name || 'Candidate'}
- **Match Score**: ${candidateData.match_score}%
- **Matched Skills**: ${(candidateData.matched_skills || []).join(', ')}
- **Missing Skills**: ${(candidateData.missing_skills || []).join(', ')}
- **Experience**: ${candidateData.experience_summary || 'N/A'}

## Job Details
- **Title**: ${candidateData.job_title || 'Position'}

## Analysis Notes
**Strengths**: ${candidateData.strengths || 'N/A'}
**Weaknesses**: ${candidateData.weaknesses || 'N/A'}
**Why Best Fit**: ${candidateData.why_best_fit || 'N/A'}

## Requirements
Generate 8 interview questions in this exact JSON format — ONLY valid JSON, no markdown, no code blocks:

{
  "questions": [
    {
      "id": 1,
      "category": "Technical",
      "question": "...",
      "what_to_listen_for": "..."
    },
    {
      "id": 2,
      "category": "Behavioral",
      "question": "...",
      "what_to_listen_for": "..."
    }
  ]
}

Categories to cover: Technical (2-3), Behavioral (2), Experience Deep-Dive (2), Problem-Solving (1-2).
Make questions specific to this candidate's profile — probe their missing skills and verify their claimed strengths.
Do NOT use generic questions. Tailor every question to the specific candidate and job.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { questions: [] };
    } catch (error) {
      console.error('Interview question generation error:', error.message);
      return { questions: [] };
    }
  }

  /**
   * Build the analysis prompt for CV scoring
   */
  _buildAnalysisPrompt(cvText, jobTitle, jobDescription) {
    return `You are an expert Senior HR Analyst with 15+ years of experience in technical recruitment and talent acquisition. Your specialty is deeply analyzing CVs/Resumes against job descriptions to find the BEST possible candidates.

## Task
Analyze the following CV against the job description and provide a comprehensive, structured evaluation.

## Job Details
**Title**: ${jobTitle}
**Description**:
${jobDescription}

## Candidate CV Content
${cvText}

## Analysis Requirements
Analyze the CV and return a JSON object with the following structure — ONLY valid JSON, no markdown, no code blocks, no backticks:

{
  "analysis": {
    "match_score": <0-100 integer>,
    "matched_skills": ["skill1", "skill2"],
    "partial_match_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2"],
    "extra_skills": ["skill1", "skill2"],
    "years_of_experience": <number or null>,
    "experience_summary": "Brief summary of experience",
    "education_match": "Yes" | "Partial" | "No",
    "education_details": "Details about education match"
  },
  "evaluation": {
    "why_best_fit": "2-3 sentences explaining why this candidate fits",
    "strengths": "2-3 sentences about key strengths",
    "weaknesses": "2-3 sentences about gaps or concerns",
    "red_flags": "Any concerns found or 'None detected'",
    "recommendation": "Shortlist" | "Consider" | "Reject"
  },
  "score_breakdown": {
    "skills_match": <0-100>,
    "experience_relevance": <0-100>,
    "education": <0-100>,
    "overall_fit": <0-100>
  }
}

## Scoring Guidelines
- **match_score** (overall): Weighted calculation based on all factors
- **skills_match**: What % of required skills are present (including partial matches)
- **experience_relevance**: How relevant is their experience level to the role
- **education**: Does their education meet requirements
- **overall_fit**: Holistic assessment

## Critical Rules
1. BE HONEST — if the candidate is not a good fit, score low and recommend "Reject"
2. Be specific — mention actual skills, technologies, and experiences from the CV
3. Missing skills = required skills NOT found in CV at all
4. Partial match skills = related but not exact (e.g., "React" vs "Next.js" both frontend)
5. For "why_best_fit", "strengths", and "weaknesses" — write in FULL sentences, not bullet points
6. Match score should be a FAIR assessment, not inflated`;
  }

  /**
   * Parse the AI response JSON
   */
  _parseResponse(text) {
    // Extract JSON from response (handles cases where model adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response. Invalid format received.');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error('JSON parse error:', error.message);
      throw new Error('Failed to parse AI analysis result.');
    }
  }
}

module.exports = new GeminiService();
