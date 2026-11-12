import { Router } from 'express';
import { db } from '../db.js';
import { getModelStatus, verifyAndDiscoverGeminiModel } from '../gemini.js';
import { authenticate, requireRole, getTokenExpiry } from '../middleware/auth.js';

const router = Router();

// Health check endpoint (public)
router.get('/health', (_req, res) => {
  const modelStatus = getModelStatus();
  const hasEnvJwtSecret = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0);

  res.json({
    status: 'ok',
    app: 'Buddy Elder AI',
    timestamp: new Date().toISOString(),
    auth: {
      jwtConfigured: hasEnvJwtSecret,
      tokenExpiry: getTokenExpiry(),
      mode: hasEnvJwtSecret ? 'environment' : 'ephemeral_dev'
    },
    gemini: {
      activeModel: modelStatus.activeModel,
      isVerified: modelStatus.isVerified,
      hasApiKey: modelStatus.hasApiKey
    },
    database: 'healthy (file + Postgres ready)'
  });
});

// Admin stats
router.get('/admin/stats', authenticate, requireRole(['ADMIN']), (_req, res) => {
  const stats = db.getAdminStats();
  const modelStatus = getModelStatus();
  res.json({ stats, modelStatus });
});

// Admin probe to verify and discover functional Gemini model
router.post('/admin/gemini/probe', authenticate, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await verifyAndDiscoverGeminiModel();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to probe Gemini models' });
  }
});

// Status check (accessible to logged-in users to show in UI if wanted)
router.get('/gemini/status', (_req, res) => {
  res.json(getModelStatus());
});

export default router;
