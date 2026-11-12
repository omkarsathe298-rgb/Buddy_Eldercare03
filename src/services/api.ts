import {
  User,
  Conversation,
  Message,
  Lesson,
  WellnessCheckin,
  LinkedElder,
  EmergencyContact,
  ScamAdvisory,
  ScamReport,
  KnowledgeSource,
  GeminiStatus,
  AppLanguage,
  CaregiverNote
} from '../types';

const TOKEN_KEY = 'buddy_elder_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async getDemoAccounts(): Promise<{ accounts: { role: string; email: string; name: string; password: string }[] }> {
    return apiRequest('/api/auth/demo-accounts');
  },

  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User; message: string }> {
    const res = await apiRequest<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    tokenStorage.set(res.token);
    return res;
  },

  async logout(): Promise<{ message: string }> {
    try {
      await apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clear();
    }
    return { message: 'Logged out successfully' };
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
    preferredLang?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await apiRequest<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    tokenStorage.set(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return apiRequest('/api/auth/me');
  },

  async updateProfile(updates: Partial<User & { emergencyContact?: string; emergencyPhone?: string; medicalNotes?: string }>): Promise<{ user: User; message: string }> {
    return apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Chat & Conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return apiRequest('/api/conversations');
  },

  async createConversation(title = 'New Conversation', language: AppLanguage = 'en'): Promise<{ conversation: Conversation }> {
    return apiRequest('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, language })
    });
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    return apiRequest(`/api/conversations/${id}`);
  },

  async updateConversation(id: string, updates: { title?: string; language?: AppLanguage }): Promise<{ conversation: Conversation }> {
    return apiRequest(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteConversation(id: string): Promise<{ message: string }> {
    return apiRequest(`/api/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  async clearConversation(id: string): Promise<{ message: string }> {
    return apiRequest(`/api/conversations/${id}/clear`, {
      method: 'POST'
    });
  },

  async sendMessage(payload: {
    conversationId?: string;
    text: string;
    language: AppLanguage;
  }): Promise<{
    conversationId: string;
    userMessage: Message;
    buddyMessage: Message;
    citations: any[];
    modelUsed: string;
  }> {
    return apiRequest('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Lessons
  async getLessons(): Promise<{ lessons: Lesson[] }> {
    return apiRequest('/api/lessons');
  },

  async getLesson(slug: string): Promise<{ lesson: Lesson }> {
    return apiRequest(`/api/lessons/${slug}`);
  },

  async saveProgress(lessonId: string, completed = true, quizScore?: number): Promise<{ message: string; progress: any }> {
    return apiRequest('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ lessonId, completed, quizScore })
    });
  },

  // Wellness
  async getCheckins(): Promise<{ checkins: WellnessCheckin[] }> {
    return apiRequest('/api/checkins');
  },

  async saveCheckin(checkin: {
    date?: string;
    mood: string;
    waterGlasses: number;
    stepsTaken: number;
    sleepHours?: number;
    medicationTaken: boolean;
    notes?: string;
  }): Promise<{ message: string; checkin: WellnessCheckin }> {
    return apiRequest('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(checkin)
    });
  },

  // Caregiver
  async getLinkedElders(): Promise<{ elders: LinkedElder[] }> {
    return apiRequest('/api/caregiver/elders');
  },

  async linkElder(elderEmail: string): Promise<{ message: string; link: any }> {
    return apiRequest('/api/caregiver/link', {
      method: 'POST',
      body: JSON.stringify({ elderEmail })
    });
  },

  async addCaregiverNote(elderId: string, title: string, content: string): Promise<{ message: string; note: CaregiverNote }> {
    return apiRequest('/api/caregiver/notes', {
      method: 'POST',
      body: JSON.stringify({ elderId, title, content })
    });
  },

  async getElderCaregivers(): Promise<{ caregivers: any[]; notes: CaregiverNote[] }> {
    return apiRequest('/api/elder/caregivers');
  },

  // Safety & Scam Defense
  async getEmergencyContacts(): Promise<{ contacts: EmergencyContact[] }> {
    return apiRequest('/api/safety/contacts');
  },

  async getScamAdvisories(): Promise<{ advisories: ScamAdvisory[] }> {
    return apiRequest('/api/safety/advisories');
  },

  async analyzeScamMessage(text: string, language: AppLanguage = 'en'): Promise<{ report: ScamReport }> {
    return apiRequest('/api/safety/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, language })
    });
  },

  // Knowledge & RAG
  async getKnowledgeSources(): Promise<{ sources: KnowledgeSource[] }> {
    return apiRequest('/api/knowledge/sources');
  },

  async searchKnowledge(query: string, maxResults = 3): Promise<{ results: any[]; resultsCount: number }> {
    return apiRequest('/api/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, maxResults })
    });
  },

  async addKnowledgeSource(payload: {
    title: string;
    url: string;
    publisher: string;
    category: string;
    summary: string;
    content: string;
    keywords?: string[];
  }): Promise<{ message: string; source: KnowledgeSource }> {
    return apiRequest('/api/knowledge/sources', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin & System
  async getAdminStats(): Promise<{ stats: any; modelStatus: GeminiStatus }> {
    return apiRequest('/api/admin/stats');
  },

  async probeGeminiModel(): Promise<any> {
    return apiRequest('/api/admin/gemini/probe', {
      method: 'POST'
    });
  },

  async getGeminiStatus(): Promise<GeminiStatus> {
    return apiRequest('/api/gemini/status');
  }
};
