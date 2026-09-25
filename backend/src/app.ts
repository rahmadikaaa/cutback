import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { healthHandler } from './health';
import { smokeTestHandler } from './smoke';
import { uploadHandler } from './upload';
import { analysisHandler } from './analysis';
import { recommendationHandler, selectHairstyleHandler } from './recommendation';
import { previewHandler } from './preview';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Set up multer using memory storage with 10MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10_000_000 }
});

app.get('/health', healthHandler);
app.post('/diagnostic/smoke', smokeTestHandler);
app.post('/api/upload', upload.single('photo'), uploadHandler);
app.post('/api/analyze', analysisHandler);
app.post('/api/recommendations', recommendationHandler);
app.post('/api/select', selectHairstyleHandler);
app.post('/api/preview', previewHandler);

// Basic error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', route: 'REUPLOAD', message: 'File exceeds 10MB limit' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Internal server error' });
});

export default app;
