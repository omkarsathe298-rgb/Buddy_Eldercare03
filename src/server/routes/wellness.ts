import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function resolveUserId(req: AuthenticatedRequest): string {
  return req.user ? req.user.id : 'usr-elder-1';
}

// 1. Get recent wellness check-ins
router.get('/checkins', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const checkins = db.getWellnessCheckins(userId, 14);
  res.json({ checkins });
});

// 2. Submit or update today's wellness checkin
router.post('/checkins', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { date, mood, waterGlasses, stepsTaken, sleepHours, medicationTaken, notes } = req.body;

  const todayStr = date || new Date().toISOString().split('T')[0];

  const checkin = db.saveWellnessCheckin(userId, {
    date: todayStr,
    mood: mood || 'happy',
    waterGlasses: typeof waterGlasses === 'number' ? waterGlasses : 4,
    stepsTaken: typeof stepsTaken === 'number' ? stepsTaken : 1000,
    sleepHours: typeof sleepHours === 'number' ? sleepHours : 7,
    medicationTaken: medicationTaken !== undefined ? medicationTaken : true,
    notes: notes || ''
  });

  res.json({ message: 'Wellness check-in saved!', checkin });
});

export default router;
