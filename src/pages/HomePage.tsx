import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Activity,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Droplet,
  Footprints,
  Smile,
  Users,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { EditProfileModal } from '../components/EditProfileModal';
import { api } from '../services/api';
import { WellnessCheckin, Lesson } from '../types';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const [latestCheckin, setLatestCheckin] = useState<WellnessCheckin | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    api.getCheckins().then(res => {
      if (res.checkins && res.checkins.length > 0) {
        setLatestCheckin(res.checkins[0]);
      }
    }).catch(console.warn);

    api.getLessons().then(res => {
      setLessons(res.lessons || []);
    }).catch(console.warn);
  }, []);

  const greetings = {
    en: `Namaste, ${user?.name || 'Friend'}!`,
    hi: `नमस्ते, ${user?.name || 'मित्र'} जी!`,
    mr: `नमस्कार, ${user?.name || 'मित्र'}!`
  };

  const welcomeSub = {
    en: 'I am Buddy, your digital companion. What would you like to explore or practice today?',
    hi: 'मैं आपका डिजिटल साथी बडी हूँ। आज आप क्या सीखना या अभ्यास करना चाहते हैं?',
    mr: 'मी तुमचा डिजिटल मित्र बडी आहे. आज तुम्हाला काय शिकायचे किंवा सराव करायचा आहे?'
  };

  const currentGreeting = greetings[language] || greetings.en;
  const currentSub = welcomeSub[language] || welcomeSub.en;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-emerald-800 via-teal-800 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-sm font-semibold border border-emerald-400/30">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Buddy Elder AI v2.0 • Active</span>
            </span>
            <AudioSpeakButton text={`${currentGreeting}. ${currentSub}`} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {currentGreeting}
            </h1>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold border border-white/25 transition-colors cursor-pointer"
              title="Change your name or how Buddy greets you"
            >
              <Edit3 className="w-4 h-4 text-emerald-300" />
              <span>Change Name</span>
            </button>
          </div>

          <p className="text-xl sm:text-2xl text-emerald-100 font-normal leading-relaxed">
            {currentSub}
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('chat')}
              className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold text-xl rounded-2xl shadow-lg transition-transform hover:scale-102 cursor-pointer"
            >
              <MessageSquare className="w-6 h-6 fill-stone-950/20" />
              <span>{t('navChat')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('safety')}
              className="inline-flex items-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xl rounded-2xl shadow-lg transition-transform hover:scale-102 cursor-pointer"
            >
              <ShieldCheck className="w-6 h-6" />
              <span>{t('navSafety')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Core Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: AI Chat Quick Launcher */}
        <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-emerald-500 shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">
              {t('navChat')}
            </h2>
            <p className="text-lg text-stone-600 leading-snug">
              Ask any question in English, Hindi, or Marathi. Buddy explains smartphone steps simply and patiently.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('chat')}
            className="mt-6 w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-lg rounded-xl flex items-center justify-center gap-2 border border-emerald-200 cursor-pointer"
          >
            <span>Open Chat</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Card 2: Scam & Fraud Defense Center */}
        <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 hover:border-amber-500 shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-900">
                {t('navSafety')}
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-full">
                Fraud 1930
              </span>
            </div>
            <p className="text-lg text-stone-600 leading-snug">
              Received a suspicious SMS, electricity bill warning, or lottery call? Paste it to check risk before clicking.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('safety')}
            className="mt-6 w-full py-3.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-lg rounded-xl flex items-center justify-center gap-2 border border-amber-300 cursor-pointer"
          >
            <span>Check a Message</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Card 3: Daily Wellness */}
        <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-teal-500 shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Activity className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">
              {t('todayWellness')}
            </h2>
            <div className="space-y-2 pt-1 text-stone-700">
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-sky-500" />
                  Water Intake:
                </span>
                <span className="font-bold">{latestCheckin ? `${latestCheckin.waterGlasses} glasses` : '4 glasses'}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-emerald-600" />
                  Walking Steps:
                </span>
                <span className="font-bold">{latestCheckin ? `${latestCheckin.stepsTaken}` : '1,850'}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  Today's Mood:
                </span>
                <span className="font-bold capitalize">{latestCheckin ? latestCheckin.mood : 'Good'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('wellness')}
            className="mt-6 w-full py-3.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-lg rounded-xl flex items-center justify-center gap-2 border border-teal-200 cursor-pointer"
          >
            <span>Update Today's Health</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Featured Digital Lessons Preview */}
      <section className="bg-stone-50 rounded-3xl p-6 sm:p-8 border-2 border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-emerald-600" />
              <span>Recommended Digital Lessons</span>
            </h2>
            <p className="text-lg text-stone-600 mt-1">
              Step-by-step guides with practice quizzes designed for seniors.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('lessons')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base cursor-pointer"
          >
            View All Lessons
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.slice(0, 2).map(lesson => (
            <div
              key={lesson.id}
              onClick={() => setActiveTab('lessons')}
              className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-1 rounded bg-stone-100 text-stone-700">
                    {lesson.category}
                  </span>
                  {lesson.completed && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ✓ Completed
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-1">
                  {language === 'hi' ? lesson.titleHi : language === 'mr' ? lesson.titleMr : lesson.title}
                </h3>
                <p className="text-stone-600 text-base">
                  {language === 'hi' ? lesson.summaryHi : language === 'mr' ? lesson.summaryMr : lesson.summary}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-100 text-emerald-700 font-bold text-base">
                <span>Start Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency & Family Caregiver Link Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Caregiver Card */}
        <div className="bg-sky-50 rounded-2xl p-6 border-2 border-sky-200 flex items-start gap-4">
          <div className="p-3 bg-sky-200 text-sky-800 rounded-xl shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-xl font-bold text-sky-950">
              Family & Caregiver Connection
            </h3>
            <p className="text-base text-sky-800">
              Linked Caregiver: <strong>Priya Sharma (Daughter)</strong>. Your family can view wellness check-ins and send medicine reminders.
            </p>
            <button
              onClick={() => setActiveTab('caregiver')}
              className="mt-2 text-sky-900 font-bold underline hover:text-sky-950 cursor-pointer text-base"
            >
              Manage Family Circle →
            </button>
          </div>
        </div>

        {/* Emergency Assistance Card */}
        <div className="bg-rose-50 rounded-2xl p-6 border-2 border-rose-200 flex items-start gap-4">
          <div className="p-3 bg-rose-200 text-rose-800 rounded-xl shrink-0">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-xl font-bold text-rose-950">
              Need Instant Emergency Help?
            </h3>
            <p className="text-base text-rose-800">
              Dial <strong>112</strong> for Police & Ambulance. Dial <strong>1930</strong> immediately if any money was transferred suspiciously.
            </p>
            <a
              href="tel:112"
              className="mt-2 inline-block text-rose-900 font-bold underline hover:text-rose-950 text-base"
            >
              Call 112 Helpline Now →
            </a>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
};
