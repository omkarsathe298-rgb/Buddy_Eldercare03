import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './src/server/routes/auth.js';
import chatRoutes from './src/server/routes/chat.js';
import lessonsRoutes from './src/server/routes/lessons.js';
import caregiverRoutes from './src/server/routes/caregiver.js';
import wellnessRoutes from './src/server/routes/wellness.js';
import safetyRoutes from './src/server/routes/safety.js';
import knowledgeRoutes from './src/server/routes/knowledge.js';
import adminRoutes from './src/server/routes/admin.js';
import { verifyAndDiscoverGeminiModel } from './src/server/gemini.js';
import { validateJwtSecretAtStartup } from './src/server/middleware/auth.js';

dotenv.config();

// Validate JWT configuration immediately at startup
const jwtValidation = validateJwtSecretAtStartup();
if (jwtValidation.isConfigured) {
  console.log('🔒 JWT Authentication: Configured with environment secret.');
} else {
  console.log('🔑 JWT Authentication: Development ephemeral secret active.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security and utility middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', lessonsRoutes);
app.use('/api', caregiverRoutes);
app.use('/api', wellnessRoutes);
app.use('/api', safetyRoutes);
app.use('/api', knowledgeRoutes);
app.use('/api', adminRoutes);

// Vite dev server mounting or static dist serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Buddy Elder AI server running at http://0.0.0.0:${PORT}`);
    // Probe Gemini models in background
    verifyAndDiscoverGeminiModel().then(res => {
      if (res.success) {
        console.log(`Gemini AI active model verified: ${res.model}`);
      } else {
        console.log(`Gemini status: ${res.error || 'Awaiting API key or using safe fallback'}`);
      }
    }).catch(err => {
      console.warn('Initial model discovery probe warning:', err?.message || err);
    });
  });
}

startServer();
