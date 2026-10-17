import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes.js';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    status: 'ok',
    app: 'ReworkGuard API',
    version: '1.0.0',
    port: Number(PORT),
    db_connected: db.isSupabaseActive(),
    timestamp: new Date().toISOString(),
  });
});

let isReady = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabaseReady() {
  if (isReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await db.initDatabaseConnection();
      } catch (err: any) {
        console.warn('Database initialization note:', err.message);
      } finally {
        isReady = true;
      }
    })();
  }
  await initPromise;
}

// Database readiness middleware for API routes
app.use('/api', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isReady) {
    await ensureDatabaseReady();
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Serve static frontend in production if dist/ exists
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      console.log('🔄 Initializing ReworkGuard database connection...');
      await ensureDatabaseReady();
      app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 ReworkGuard Server running on http://127.0.0.1:${PORT}`);
        console.log(`📡 API Endpoints available under http://127.0.0.1:${PORT}/api`);
      });
    } catch (err: any) {
      console.error('Failed to bind server port:', err);
      process.exit(1);
    }
  })();
}
