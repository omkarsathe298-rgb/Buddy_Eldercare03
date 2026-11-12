import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function resolveUserId(req: AuthenticatedRequest): string {
  return req.user ? req.user.id : 'usr-elder-1';
}

// 1. List all lessons with user progress
router.get('/lessons', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const lessons = db.getLessons();
  const progressList = db.getLessonProgress(userId);

  const progressMap = new Map(progressList.map(p => [p.lessonId, p]));

  const lessonsWithProgress = lessons.map(lesson => {
    const prog = progressMap.get(lesson.id);
    return {
      ...lesson,
      completed: prog ? prog.completed : false,
      quizScore: prog ? prog.quizScore : null,
      completedAt: prog ? prog.completedAt : null
    };
  });

  res.json({ lessons: lessonsWithProgress });
});

// 2. Get specific lesson by slug
router.get('/lessons/:slug', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { slug } = req.params;
  const lesson = db.getLessonBySlug(slug);

  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  const progressList = db.getLessonProgress(userId);
  const prog = progressList.find(p => p.lessonId === lesson.id);

  res.json({
    lesson: {
      ...lesson,
      completed: prog ? prog.completed : false,
      quizScore: prog ? prog.quizScore : null
    }
  });
});

// 3. Mark lesson complete or submit quiz
router.post('/progress', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { lessonId, completed = true, quizScore } = req.body;

  if (!lessonId) {
    res.status(400).json({ error: 'Lesson ID is required' });
    return;
  }

  const progress = db.saveLessonProgress(userId, lessonId, completed, quizScore);
  res.json({ message: 'Progress recorded!', progress });
});

export default router;
