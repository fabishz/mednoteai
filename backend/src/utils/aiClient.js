import { env } from '../config/env.js';

const SYSTEM_PROMPT = `You are a medical documentation assistant. Convert raw clinical notes into a structured report using the exact headings below. Do not add extra headings or commentary. Output must be plain text with the headings in order.

Chief Complaint:
History of Present Illness:
Past Medical History:
Examination Findings:
Diagnosis:
Treatment Plan:
Recommendations:`;

export class AIClient {
  static async generateStructuredNote(rawInputText, retryCount = 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const res = await fetch(env.aiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.aiApiKey}`
        },
        body: JSON.stringify({
          model: env.aiModel,
          system: SYSTEM_PROMPT,
          input: rawInputText
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        if (retryCount > 0 && res.status >= 500) {
          return this.generateStructuredNote(rawInputText, retryCount - 1);
        }
        const text = await res.text();
        throw Object.assign(new Error('AI service error'), { status: 502, details: text });
      }

      const data = await res.json();
      const output = data.output || data.text || data.result;

      if (!output || typeof output !== 'string') {
        throw Object.assign(new Error('Invalid AI response format'), { status: 502 });
      }

      return output.trim();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw Object.assign(new Error('AI request timed out'), { status: 504 });
      }
      if (retryCount > 0) {
        return this.generateStructuredNote(rawInputText, retryCount - 1);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
