import { GoogleGenAI } from '@google/genai';

/**
 * Centralized Gemini Client Factory supporting both:
 * 1. Google Cloud Vertex AI (Uses GCP Free Credits via ADC or Service Account)
 * 2. Google AI Studio Developer API (Via GEMINI_API_KEY)
 */
export function getGeminiClient(): {
  client: GoogleGenAI | null;
  modelName: string;
  isVertex: boolean;
} {
  const useVertex =
    process.env.USE_VERTEX_AI === 'true' ||
    Boolean(process.env.GOOGLE_CLOUD_PROJECT) ||
    Boolean(process.env.GCP_PROJECT_ID);

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // 1. If configured for Vertex AI with GCP Free Credits
  if (useVertex && project) {
    try {
      const client = new GoogleGenAI({
        vertexai: true,
        project,
        location,
      });
      return { client, modelName, isVertex: true };
    } catch (e) {
      console.warn('Failed to initialize Vertex AI client:', e);
    }
  }

  // 2. If configured with direct AI Studio API Key
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const client = new GoogleGenAI({ apiKey });
      return { client, modelName, isVertex: false };
    } catch (e) {
      console.warn('Failed to initialize AI Studio Gemini client:', e);
    }
  }

  // 3. Fallback mode (Built-in offline emergency knowledge engine)
  return { client: null, modelName, isVertex: false };
}
