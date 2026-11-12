import { Router } from 'express';
import { db } from '../db.js';
import { generateBuddyResponse } from '../gemini.js';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get or create fallback user ID for unauthenticated visitors
function resolveUserId(req: AuthenticatedRequest): string {
  if (req.user) return req.user.id;
  // Default to the seeded elder user 'usr-elder-1'
  return 'usr-elder-1';
}

// 1. List conversations
router.get('/conversations', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const conversations = db.getConversations(userId);
  res.json({ conversations });
});

// 2. Create conversation
router.post('/conversations', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { title = 'New Conversation', language = 'en' } = req.body;
  const conversation = db.createConversation(userId, title, language);
  res.status(201).json({ conversation });
});

// 3. Get single conversation and message history
router.get('/conversations/:id', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const conversation = db.getConversation(id, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const messages = db.getMessages(id);
  res.json({ conversation, messages });
});

// 4. Update/Rename conversation
router.patch('/conversations/:id', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const { title, language } = req.body;

  const updated = db.updateConversation(id, userId, {
    ...(title && { title }),
    ...(language && { language })
  });

  if (!updated) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  res.json({ conversation: updated });
});

// 5. Delete conversation
router.delete('/conversations/:id', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const deleted = db.deleteConversation(id, userId);

  if (!deleted) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  res.json({ message: 'Conversation deleted successfully.' });
});

// 6. Clear messages in conversation
router.post('/conversations/:id/clear', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const conversation = db.getConversation(id, userId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  db.clearMessages(id);
  res.json({ message: 'Conversation cleared.' });
});

// 7. Send message & generate real Buddy AI response
router.post('/chat/message', optionalAuthenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = resolveUserId(req);
    const { conversationId, text, language = 'en' } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    // Ensure conversation exists or create one
    let targetConvId = conversationId;
    if (!targetConvId) {
      const newConv = db.createConversation(userId, text.slice(0, 30), language);
      targetConvId = newConv.id;
    } else {
      const existing = db.getConversation(targetConvId, userId);
      if (!existing) {
        const newConv = db.createConversation(userId, text.slice(0, 30), language);
        targetConvId = newConv.id;
      }
    }

    // Save user message to database
    const userMsg = db.addMessage(targetConvId, 'user', text.trim());

    // Fetch previous conversation history for multi-turn context
    const allMessages = db.getMessages(targetConvId);
    const history = allMessages
      .slice(0, -1)
      .map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('buddy' as const),
        text: m.text
      }));

    // Generate real response using Gemini with RAG citations
    const buddyResult = await generateBuddyResponse({
      userMessage: text.trim(),
      history,
      language
    });

    // Save buddy response to database
    const buddyMsg = db.addMessage(
      targetConvId,
      'buddy',
      buddyResult.text,
      buddyResult.citations
    );

    res.json({
      conversationId: targetConvId,
      userMessage: userMsg,
      buddyMessage: buddyMsg,
      citations: buddyResult.citations,
      modelUsed: buddyResult.modelUsed
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: err?.message || 'Buddy encountered a temporary error. Please try asking again in a moment.'
    });
  }
});

export default router;
