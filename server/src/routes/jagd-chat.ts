/**
 * Jagd Chat Routes
 *
 * API endpoint for AI-powered hunting advisor chat using Gemini.
 * Provides domain-specific hunting guidance for the DACH region.
 */

import { Elysia } from 'elysia';
import { GoogleGenAI } from '@google/genai';

// ============================================================================
// Configuration
// ============================================================================

const SYSTEM_PROMPT =
  'Du bist ein erfahrener Jagdberater und KI-Assistent fuer Jaeger in der DACH-Region. ' +
  'Du hilfst bei Fragen zu Jagdrecht, Wildbiologie, Reviermanagement, Waffenpflege und Jagdpraxis. ' +
  'Antworte immer auf Deutsch und verwende korrekte jagdliche Fachbegriffe.';

const MODEL = 'gemini-2.5-flash-preview-05-20';

// ============================================================================
// Route Factory
// ============================================================================

export function createJagdChatRoutes() {
  const apiKey = process.env.GEMINI_API_KEY;
  let client: GoogleGenAI | null = null;

  if (apiKey) {
    client = new GoogleGenAI({ apiKey });
  } else {
    console.warn('[JagdChat] GEMINI_API_KEY not set, chat will return mock responses');
  }

  return new Elysia({ prefix: '/api/v1/jagd' })
    .post('/chat', async ({ request, set }) => {
      try {
        const body = await request.json();
        const prompt = body?.prompt;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
          set.status = 400;
          return { error: 'prompt is required and must be a non-empty string' };
        }

        // If no API key, return a mock response
        if (!client) {
          return {
            response:
              'Der KI-Jagdberater ist derzeit nicht verfuegbar. ' +
              'Bitte konfigurieren Sie die GEMINI_API_KEY Umgebungsvariable, ' +
              'um den vollen Funktionsumfang zu nutzen.',
          };
        }

        const response = await client.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        const text = response.text ?? '';

        return {
          response: text,
        };
      } catch (error) {
        console.error('[JagdChat] Error processing chat:', error);
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : 'Failed to process chat message',
        };
      }
    });
}
