import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { VoiceProvider } from './context/VoiceContext';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { LearningPage } from './pages/LearningPage';
import { SafetyPage } from './pages/SafetyPage';
import { WellnessPage } from './pages/WellnessPage';
import { CaregiverPage } from './pages/CaregiverPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShieldCheck, Heart, PhoneCall, Globe } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { language } = usePreferences();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage setActiveTab={setActiveTab} />;
      case 'chat':
        return <ChatPage />;
      case 'lessons':
        return <LearningPage />;
      case 'safety':
        return <SafetyPage />;
      case 'wellness':
        return <WellnessPage />;
      case 'caregiver':
        return <CaregiverPage />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans transition-colors">
      {/* 24/7 Emergency & Cyber Helpline Banner */}
      <EmergencyBanner />

      {/* Main Accessible Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {renderActiveTab()}
      </main>

      {/* Senior-Accessible Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 py-8 px-4 sm:px-6 lg:px-8 text-base">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 font-extrabold text-white text-xl">
              <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
              <span>Buddy Elder AI</span>
              <span className="text-xs font-mono bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                Senior Safety Platform
              </span>
            </div>
            <p className="text-sm text-stone-400 max-w-md">
              Empowering senior citizens with patient digital guidance, scam defense, and caring family connections in English, Hindi, and Marathi.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <a href="tel:1930" className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300">
              <PhoneCall className="w-4 h-4" />
              <span>Cyber Fraud Helpline: 1930</span>
            </a>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <a href="tel:112" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300">
              <PhoneCall className="w-4 h-4" />
              <span>Emergency Services: 112</span>
            </a>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>CERT-In & RBI Kehta Hai Aligned</span>
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-stone-800 text-xs text-stone-500 text-center flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Buddy Elder AI. Built for accessibility, respect, and safety.</span>
          <span>Never enter your secret UPI PIN to receive money. Never share bank OTPs.</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <VoiceProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </VoiceProvider>
    </PreferencesProvider>
  );
}
