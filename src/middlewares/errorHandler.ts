import type { NextFunction, Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  const statusCode = typeof (err as { statusCode?: number })?.statusCode === 'number' ? (err as { statusCode: number }).statusCode : 500;

  res.status(statusCode).json({ message });
};