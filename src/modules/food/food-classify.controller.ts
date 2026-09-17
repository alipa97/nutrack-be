import type { Request, Response } from 'express';
import { foodClassifyService } from './food-classify.service.js';

export const foodClassifyController = {
  async classify(req: Request, res: Response) {
    // Multer places the file in req.file
    const file = req.file;

    if (!file) {
      return void res.status(400).json({
        success: false,
        status: 'error',
        food: null,
        confidence: null,
        accepted: false,
        message: 'File tidak ditemukan dalam request. Harap upload file gambar.',
      });
    }

    try {
      const result = await foodClassifyService.classify(file.buffer, file.originalname, file.mimetype);
      
      // AI service might return status 'error' or 'retake' or 'accepted'
      // We generally want to return 200 OK as long as the AI service successfully processed it 
      // (even if it's a 'retake'), so the frontend can read the JSON.
      // If it's a hard error (model not available), we can return 503.
      if (result.status === 'error' && result.message.includes('AI tidak tersedia')) {
        return void res.status(503).json(result);
      }
      
      if (result.status === 'error' && result.message.includes('ukuran file')) {
        return void res.status(413).json(result);
      }

      if (result.status === 'error') {
         return void res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('[food-classify.controller] Error:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        food: null,
        confidence: null,
        accepted: false,
        message: 'Terjadi kesalahan internal pada server saat memproses gambar.',
      });
    }
  },
};
