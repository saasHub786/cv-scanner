/**
 * AI Service — Uses Groq API (FREE - 14,400 requests/day)
 * No credit card needed, blazing fast inference
 */
const https = require('https');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

class AIService {
  async _call(messages, maxTokens = 2048, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this._doRequest(messages, maxTokens);
      } catch (error) {
        const msg = error.message;
        // Rate limit — wait and retry
        if (msg.includes('rate limit') || msg.includes('429')) {
          const match = msg.match(/try again in (\d+\.?\d*)s/);
          const waitMs = match ? parseInt(match[1]) * 1000 + 1000 : attempt * 3000;
          console.log(`⏳ Rate limited, retrying in ${Math.round(waitMs/1000)}s (attempt ${attempt}/${retries})`);
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, Math.min(waitMs, 15000)));
            continue;
          }
        }
        throw error;
      }
    }
  }

  async _doRequest(messages, maxTokens) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        top_p: 0.8,
      });

      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.error) return reject(new Error(json.error.message || JSON.stringify(json.error)));
            const content = json.choices?.[0]?.message?.content || '';
            if (res.statusCode === 429) return reject(new Error(body));
            resolve(content);
          } catch (e) {
            reject(new Error(`Parse error: ${body.substring(0, 200)}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(e.message)));
      req.write(data);
      req.end();
    });
  }

  async analyzeCandidate(cvText, jobTitle, jobDescription) {
    try {
      const prompt = this._buildAnalysisPrompt(cvText, jobTitle, jobDescription);
      const text = await this._call([{ role: 'user', content: prompt }]);
      return this._parseResponse(text);
    } catch (error) {
      console.error('AI analysis error:', error.message);
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('API quota reached. Please try again later.');
      }
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  async generateInterviewQuestions(candidateData) {
    try {
      const prompt = this._buildQuestionsPrompt(candidateData);
      const text = await this._call([{ role: 'user', content: prompt }], 4096);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { questions: [] };
    } catch (error) {
      console.error('Question generation error:', error.message);
      return { questions: [] };
    }
  }

  _buildAnalysisPrompt(cvText, jobTitle, jobDescription) {
    return `You are a hiring analyst. Score the CV against the job.

JOB: ${jobTitle}
REQUIREMENTS: ${jobDescription.substring(0, 1500)}

CANDIDATE CV: ${cvText.substring(0, 2500)}

Return ONLY valid JSON. No markdown. Use the EXACT keys shown:
{
  "analysis": {
    "match_score": (number 0-100, percentage matching job requirements),
    "matched_skills": (array of skills that directly match),
    "partial_match_skills": (array of partially matching skills),
    "missing_skills": (array of required skills not found in CV),
    "extra_skills": (array of bonus skills in CV not required),
    "years_of_experience": (number or null),
    "experience_summary": (string, 1 sentence),
    "education_match": "Yes" or "Partial" or "No",
    "education_details": (string)
  },
  "evaluation": {
    "why_best_fit": (string, 2-3 sentences),
    "strengths": (string, 2-3 sentences),
    "weaknesses": (string, 2-3 sentences),
    "red_flags": (string or "None detected"),
    "recommendation": "Shortlist" or "Consider" or "Reject"
  },
  "score_breakdown": {
    "skills_match": (number 0-100),
    "experience_relevance": (number 0-100),
    "education": (number 0-100),
    "overall_fit": (number 0-100)
  }
}
Shortlist=80%+ Consider=60-79% Reject=below 60%. Be honest.`;
  }

  _buildQuestionsPrompt(data) {
    const info = [
      `Name: ${data.candidate_name || 'Candidate'}`,
      `Score: ${data.match_score}%`,
      `Has: ${(data.matched_skills || []).join(', ')}`,
      `Missing: ${(data.missing_skills || []).join(', ')}`,
      `Exp: ${(data.experience_summary || '').substring(0, 100)}`,
      `Job: ${data.job_title || 'Position'}`,
    ].join('\n');

    return `You are an HR interviewer. Generate 8 questions probing missing skills, verifying strengths.

${info}

Return JSON: {"questions":[{"id":1,"category":"Technical|Behavioral|Experience|Problem-Solving","question":"...","what_to_listen_for":"..."}]}

Categories: Technical(2-3), Behavioral(2), Experience(2), Problem-Solving(1-2). Tailor to this candidate.`;
  }

  _parseResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response. Invalid format.');
    return JSON.parse(jsonMatch[0]);
  }
}

module.exports = new AIService();
