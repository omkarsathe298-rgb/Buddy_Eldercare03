export type UserRole = 'ELDER' | 'CAREGIVER' | 'ADMIN';
export type AppLanguage = 'en' | 'hi' | 'mr';
export type FontSize = 'normal' | 'large' | 'xlarge';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  preferredLang: AppLanguage;
  fontSize: FontSize;
  elderProfile?: ElderProfile;
}

export interface ElderProfile {
  id: string;
  userId: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  city?: string;
  medicalNotes?: string;
  dailyGoalSteps: number;
  waterGoalGlasses: number;
}

export interface Citation {
  title: string;
  url: string;
  publisher: string;
  category: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'buddy' | 'system';
  text: string;
  citations?: Citation[];
  feedback?: 'thumbs_up' | 'thumbs_down';
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  language: AppLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface LessonStep {
  title: string;
  description: string;
  tip?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  titleMr: string;
  category: 'smartphone' | 'whatsapp' | 'payments' | 'safety' | 'computer';
  summary: string;
  summaryHi: string;
  summaryMr: string;
  icon: string;
  order: number;
  steps: LessonStep[];
  quiz: QuizQuestion[];
  completed?: boolean;
  quizScore?: number | null;
}

export interface WellnessCheckin {
  id: string;
  userId: string;
  date: string;
  mood: 'happy' | 'calm' | 'tired' | 'sad' | 'unwell';
  waterGlasses: number;
  stepsTaken: number;
  sleepHours?: number;
  medicationTaken: boolean;
  notes?: string;
  createdAt: string;
}

export interface CaregiverNote {
  id: string;
  linkId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface LinkedElder {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredLang: AppLanguage;
  profile?: ElderProfile;
  recentCheckins: WellnessCheckin[];
  lessonProgressCount: number;
  notes: CaregiverNote[];
}

export interface EmergencyContact {
  name: string;
  number: string;
  category: string;
  description: string;
}

export interface ScamAdvisory {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  summary: string;
  safetyRule: string;
  keywords: string[];
}

export interface ScamReport {
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGER_SCAM';
  score: number;
  verdict: string;
  reasons: string[];
  safeAction: string;
  emergencyNumber: string;
  officialReference: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  category: string;
  trustScore: number;
  lastVerified: string;
  summary: string;
  chunks: {
    id: string;
    content: string;
    keywords: string[];
  }[];
}

export interface GeminiStatus {
  activeModel: string;
  isVerified: boolean;
  hasApiKey: boolean;
  lastChecked: string;
  lastError: string | null;
  candidateModels: string[];
}
