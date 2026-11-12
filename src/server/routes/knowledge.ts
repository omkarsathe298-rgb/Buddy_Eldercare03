import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// 1. List all verified knowledge sources
router.get('/knowledge/sources', (_req, res) => {
  const sources = db.getKnowledgeSources();
  res.json({ sources });
});

// 2. Search knowledge base (RAG query test)
router.post('/knowledge/search', (req, res) => {
  const { query, maxResults = 4 } = req.body;
  if (!query) {
    res.status(400).json({ error: 'Search query is required.' });
    return;
  }

  const results = db.searchKnowledge(query, Number(maxResults));
  res.json({ query, resultsCount: results.length, results });
});

// 3. Ingest a new document / source (Admin only)
router.post('/knowledge/sources', authenticate, requireRole(['ADMIN']), (req: AuthenticatedRequest, res) => {
  const { title, url, publisher, category, summary, content, keywords } = req.body;

  if (!title || !url || !publisher || !summary || !content) {
    res.status(400).json({ error: 'Title, URL, publisher, summary, and content are required.' });
    return;
  }

  // Split content into clean chunks
  const paragraphs = content.split(/\n\s*\n/).filter((p: string) => p.trim().length > 20);
  const keywordList = Array.isArray(keywords)
    ? keywords
    : typeof keywords === 'string'
    ? keywords.split(',').map((k: string) => k.trim())
    : [];

  const chunks = (paragraphs.length > 0 ? paragraphs : [content]).map((text: string, idx: number) => ({
    id: `chunk-${Date.now()}-${idx}`,
    content: text.trim(),
    keywords: keywordList
  }));

  const source = db.addKnowledgeSource({
    title,
    url,
    publisher,
    category: category || 'general_safety',
    trustScore: 100,
    lastVerified: new Date().toISOString(),
    summary,
    chunks
  });

  res.status(201).json({ message: 'Knowledge source ingested successfully!', source });
});

export default router;
