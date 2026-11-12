import React, { useState } from 'react';
import {
  Settings,
  Type,
  Globe,
  Volume2,
  ShieldCheck,
  User,
  LogOut,
  Sun,
  CheckCircle2,
  Edit3,
  Plus,
  Sparkles
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { EditProfileModal } from '../components/EditProfileModal';
import { AppLanguage, FontSize, UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast, t } = usePreferences();
  const { speechRate, setSpeechRate, speak, isSpeechSupported } = useVoice();
  const { user, switchRole, logout, updateProfile } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'create'>('edit');
  const [quickSaveMsg, setQuickSaveMsg] = useState<string | null>(null);

  const handleTestVoice = () => {
    const testMessages = {
      en: 'Namaste! I am Buddy, your patient digital friend. Does my voice sound clear and easy to understand at this speed?',
      hi: 'नमस्ते जी! मैं बडी हूँ। क्या मेरी आवाज़ और बोलने की गति आपको स्पष्ट और सहज लग रही है?',
      mr: 'नमस्कार! मी बडी आहे. माझा आवाज आणि बोलण्याचा वेग तुम्हाला स्पष्ट आणि नीट ऐकू येत आहे का?'
    };
    speak(testMessages[language] || testMessages.en);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-white/10 rounded-2xl text-emerald-400">
            <Settings className="w-8 h-8" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Accessibility & App Preferences</h1>
            <p className="text-stone-300 text-base mt-0.5">
              Customize text size, speaking voice speed, and language to suit your comfort.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Font Size Accessibility Setting */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <Type className="w-6 h-6 text-emerald-600" />
            <span>Text Reading Size</span>
          </div>
          <AudioSpeakButton text="Choose text size: Normal, Large, or Extra Large." size="sm" />
        </div>

        <p className="text-stone-600 text-base">
          Adjust text size across the entire application for easier, fatigue-free reading.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['normal', 'large', 'xlarge'] as FontSize[]).map(size => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                fontSize === size
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="text-sm uppercase font-semibold text-stone-500">
                {size === 'normal' ? 'Normal (16px)' : size === 'large' ? 'Large (20px - Default)' : 'Extra Large (24px)'}
              </div>
              <div className={`mt-2 font-bold ${size === 'normal' ? 'text-lg' : size === 'large' ? 'text-2xl' : 'text-3xl'}`}>
                Aa Sample
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <Globe className="w-6 h-6 text-emerald-600" />
            <span>Preferred Language</span>
          </div>
          <AudioSpeakButton text="Select your language: English, Hindi, or Marathi." size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'en', name: 'English', native: 'English' },
            { id: 'hi', name: 'Hindi', native: 'हिंदी' },
            { id: 'mr', name: 'Marathi', native: 'मराठी' }
          ].map(lang => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id as AppLanguage)}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                language === lang.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className="text-xl font-bold">{lang.native}</div>
                <div className="text-sm text-stone-500">{lang.name}</div>
              </div>
              {language === lang.id && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Voice & Speech Settings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <Volume2 className="w-6 h-6 text-emerald-600" />
            <span>Read-Aloud Voice Speed</span>
          </div>
        </div>

        <p className="text-stone-600 text-base">
          Buddy can read any text or explanation aloud. You can slow down the speed for clearer understanding.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'Very Slow (0.75x)', val: 0.75 },
            { label: 'Patient & Clear (0.9x)', val: 0.9 },
            { label: 'Normal (1.0x)', val: 1.0 }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setSpeechRate(opt.val)}
              className={`px-4 py-2.5 rounded-xl border-2 font-bold text-base cursor-pointer transition-colors ${
                speechRate === opt.val
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <button
            onClick={handleTestVoice}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow flex items-center gap-2 cursor-pointer ml-auto"
          >
            <Volume2 className="w-5 h-5" />
            <span>Test Voice Now</span>
          </button>
        </div>
      </div>

      {/* 4. Active Account & User Name Customization */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <User className="w-6 h-6 text-stone-700" />
            <span>Active Account & User Name</span>
          </div>
          <button
            onClick={() => {
              setModalMode('create');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm rounded-xl border border-stone-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add New User Profile</span>
          </button>
        </div>

        {/* Current User Card with Direct Edit Action */}
        <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-stone-900">{user?.name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {user?.role}
              </span>
            </div>
            <div className="text-base text-stone-600">
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </div>
            {user?.elderProfile?.emergencyContact && (
              <div className="text-sm text-stone-500">
                Emergency Contact: <strong>{user.elderProfile.emergencyContact}</strong> {user.elderProfile.emergencyPhone ? `(${user.elderProfile.emergencyPhone})` : ''}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setModalMode('edit');
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
            >
              <Edit3 className="w-4 h-4" />
              <span>Change User Name</span>
            </button>

            <button
              onClick={logout}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-xl text-base flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Options to Change Name with One Tap */}
        <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quick Options: Change Name with 1 Tap:</span>
            </div>
            {quickSaveMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded animate-fade-in">
                {quickSaveMsg}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Ramesh Sharma',
              'Dada ji',
              'Aaji',
              'Shanta Devi',
              'Nana ji',
              'Nani ji',
              'Aaba',
              'Suresh Patil',
              'Priya Sharma'
            ].map(presetName => (
              <button
                key={presetName}
                onClick={async () => {
                  try {
                    await updateProfile({ name: presetName });
                    setQuickSaveMsg(`✓ Name changed to "${presetName}"`);
                    setTimeout(() => setQuickSaveMsg(null), 2500);
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                  user?.name === presetName
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-emerald-100 text-stone-800 border-stone-300'
                }`}
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Role Switcher */}
        <div className="space-y-2 pt-2">
          <div className="text-base font-bold text-stone-800">Switch Demo Family Account:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['ELDER', 'CAREGIVER', 'ADMIN'] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`p-4 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                  user?.role === r
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-lg">
                  {r === 'ELDER' ? '👵 Ramesh (Elder)' : r === 'CAREGIVER' ? '👩‍👧 Priya (Caregiver)' : '🛡️ Dr. Anand (Admin)'}
                </div>
                <div className="text-xs font-normal text-stone-500 mt-0.5">Role: {r}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Edit / Create Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        defaultMode={modalMode}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
