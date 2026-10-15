import { Request, Response } from 'express';
import { checkFirestoreConnection } from './firestoreDb';

export const healthHandler = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cutback-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
};

export const firestoreHealthHandler = async (req: Request, res: Response) => {
  const result = await checkFirestoreConnection();
  const statusCode = result.connected ? 200 : (result.enabled ? 503 : 200);

  res.status(statusCode).json({
    status: result.connected ? 'ok' : 'degraded',
    service: 'cutback-backend',
    firestore: {
      enabled: result.enabled,
      connected: result.connected,
      projectId: result.projectId || null,
      message: result.message,
    },
  });
};
