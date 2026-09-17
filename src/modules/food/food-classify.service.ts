import { env } from '../../config/env.js';

export interface ClassifyResult {
  success: boolean;
  status: string;
  food: string | null;
  confidence: number | null;
  confidence_percent?: number | null;
  accepted: boolean;
  threshold?: number;
  message: string;
}

export const foodClassifyService = {
  /**
   * Proxies the uploaded image to the Python AI inference service
   * and returns the classification result.
   */
  async classify(fileBuffer: Buffer, filename: string, mimetype: string): Promise<ClassifyResult> {
    const aiUrl = `${env.aiServiceUrl}/predict`;

    // Build multipart form data for the AI service using native Blob and FormData (Node 18+)
    const blob = new Blob([fileBuffer as any], { type: mimetype });
    const form = new FormData();
    form.append('file', blob, filename);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(aiUrl, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Try to parse error from AI service
        let errorMessage = `AI service returned status ${response.status}`;
        try {
          const errorBody = await response.json() as Record<string, unknown>;
          if (errorBody.message) errorMessage = String(errorBody.message);
          else if (errorBody.detail) errorMessage = String(errorBody.detail);
        } catch {
          // ignore parse errors
        }

        return {
          success: false,
          status: 'error',
          food: null,
          confidence: null,
          accepted: false,
          message: errorMessage,
        };
      }

      const data = await response.json() as ClassifyResult;
      return data;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          status: 'error',
          food: null,
          confidence: null,
          accepted: false,
          message: 'Koneksi ke AI service timeout. Silakan coba lagi.',
        };
      }

      // Connection refused or other network errors
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[food-classify] AI service error:', errMsg);

      return {
        success: false,
        status: 'error',
        food: null,
        confidence: null,
        accepted: false,
        message: 'Model AI tidak tersedia. Pastikan AI service sudah berjalan.',
      };
    }
  },
};
