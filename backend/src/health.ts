import { Request, Response } from 'express';

export const healthHandler = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cutback-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
};
