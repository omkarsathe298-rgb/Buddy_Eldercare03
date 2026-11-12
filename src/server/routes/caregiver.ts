import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// 1. Get all elders linked to this caregiver
router.get('/caregiver/elders', authenticate, (req: AuthenticatedRequest, res) => {
  const caregiverId = req.user!.id;
  const elders = db.getLinkedElders(caregiverId);

  // Return sanitized elder records with checkins & progress
  const eldersWithDetails = elders.map(elder => {
    const checkins = db.getWellnessCheckins(elder.id, 7);
    const progress = db.getLessonProgress(elder.id);
    const notes = db.getCaregiverNotes(elder.id);

    return {
      id: elder.id,
      name: elder.name,
      email: elder.email,
      phone: elder.phone,
      preferredLang: elder.preferredLang,
      profile: elder.profile,
      recentCheckins: checkins,
      lessonProgressCount: progress.filter(p => p.completed).length,
      notes
    };
  });

  res.json({ elders: eldersWithDetails });
});

// 2. Link elder to caregiver via elder's email
router.post('/caregiver/link', authenticate, (req: AuthenticatedRequest, res) => {
  const caregiverId = req.user!.id;
  const { elderEmail } = req.body;

  if (!elderEmail) {
    res.status(400).json({ error: 'Please provide the elder member\'s email address.' });
    return;
  }

  const elder = db.findUserByEmail(elderEmail);
  if (!elder) {
    res.status(404).json({ error: 'Elder account with this email not found. Please ensure they have registered on Buddy first.' });
    return;
  }

  const result = db.linkCaregiver(req.user!.email, elder.id);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.json({ message: result.message, link: result.link });
});

// 3. Post a caregiver note / reminder for an elder
router.post('/caregiver/notes', authenticate, (req: AuthenticatedRequest, res) => {
  const caregiverId = req.user!.id;
  const { elderId, title, content } = req.body;

  if (!elderId || !title || !content) {
    res.status(400).json({ error: 'Elder ID, title, and content are required.' });
    return;
  }

  // Authorization check: Verify caregiver is linked to elder
  const linkedElders = db.getLinkedElders(caregiverId);
  const isLinked = linkedElders.some(e => e.id === elderId) || req.user?.role === 'ADMIN';

  if (!isLinked) {
    res.status(403).json({ error: 'Access denied: You are not authorized to view or leave notes for this elder.' });
    return;
  }

  const note = db.addCaregiverNote(caregiverId, elderId, title, content);
  res.status(201).json({ message: 'Note saved successfully!', note });
});

// 4. For elders: get linked family caregivers and notes left for them
router.get('/elder/caregivers', authenticate, (req: AuthenticatedRequest, res) => {
  const elderId = req.user!.id;
  const caregivers = db.getLinkedCaregivers(elderId);
  const notes = db.getCaregiverNotes(elderId);

  res.json({
    caregivers: caregivers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone
    })),
    notes
  });
});

export default router;
