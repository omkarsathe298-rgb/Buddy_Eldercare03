import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Check,
  Plus,
  Sparkles,
  Phone,
  Heart,
  Save,
  Shield,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { AudioSpeakButton } from './AudioSpeakButton';
import { AppLanguage, UserRole } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'edit' | 'create';
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'edit'
}) => {
  const { user, updateProfile, register } = useAuth();
  const { language } = usePreferences();

  const [mode, setMode] = useState<'edit' | 'create'>(defaultMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // For adding a new profile
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newRole, setNewRole] = useState<UserRole>('ELDER');
  const [newLang, setNewLang] = useState<AppLanguage>('en');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmergencyContact(user.elderProfile?.emergencyContact || '');
      setEmergencyPhone(user.elderProfile?.emergencyPhone || '');
      setMode(defaultMode);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [user, isOpen, defaultMode]);

  if (!isOpen) return null;

  // Preset quick name options to add/change with one tap
  const NAME_PRESETS = [
    { label: '👴 Ramesh Sharma', value: 'Ramesh Sharma' },
    { label: '👵 Shanta Devi', value: 'Shanta Devi' },
    { label: '👴 Dada ji', value: 'Dada ji' },
    { label: '👵 Dadi ji', value: 'Dadi ji' },
    { label: '👵 Aaji (आजी)', value: 'Aaji' },
    { label: '👴 Aaba (आबा)', value: 'Aaba' },
    { label: '👴 Nana ji', value: 'Nana ji' },
    { label: '👵 Nani ji', value: 'Nani ji' },
    { label: '👨 Suresh Patil', value: 'Suresh Patil' },
    { label: '👩 Priya Sharma', value: 'Priya Sharma' },
    { label: '👨‍⚕️ Dr. Anand Joshi', value: 'Dr. Anand Joshi' }
  ];

  const HONORIFICS = [
    { label: '+ Add "ji"', apply: (curr: string) => (curr.endsWith(' ji') ? curr : `${curr} ji`) },
    { label: '+ Add "Shri "', apply: (curr: string) => (curr.startsWith('Shri ') ? curr : `Shri ${curr}`) },
    { label: '+ Add "Smt. "', apply: (curr: string) => (curr.startsWith('Smt. ') ? curr : `Smt. ${curr}`) }
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'edit') {
        await updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          emergencyContact: emergencyContact.trim(),
          emergencyPhone: emergencyPhone.trim()
        });
        setSuccessMessage('Name and profile updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Create brand new user profile
        const emailToUse = newEmail.trim() || `senior_${Date.now()}@buddy.com`;
        await register({
          name: name.trim(),
          email: emailToUse,
          password: newPassword,
          role: newRole,
          phone: phone.trim(),
          preferredLang: newLang,
          emergencyContact: emergencyContact.trim(),
          emergencyPhone: emergencyPhone.trim()
        });
        setSuccessMessage(`New profile "${name.trim()}" created and signed in!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-stone-900 rounded-3xl max-w-2xl w-full border-2 border-stone-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              {mode === 'edit' ? <User className="w-6 h-6 text-emerald-300" /> : <UserPlus className="w-6 h-6 text-teal-300" />}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">
                {mode === 'edit' ? 'Change User Name & Profile' : 'Add New Family Profile'}
              </h2>
              <p className="text-sm text-emerald-100">
                {mode === 'edit'
                  ? 'Choose how Buddy and family members greet you'
                  : 'Add another senior or caregiver account to this app'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioSpeakButton
              text={mode === 'edit' ? 'Change your user name and profile details' : 'Add a new user profile'}
              size="sm"
            />
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'edit'
                ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Change My Name / Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setName('');
              setPhone('');
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New User Profile</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
          {/* 1. Name Input */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-stone-900">
              User Name (How Buddy should address you) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Sharma or Dada ji"
              className="w-full bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 rounded-xl px-4 py-3 text-xl font-semibold text-stone-900 focus:outline-none"
              required
            />
          </div>

          {/* Quick Name Options & Honorifics */}
          <div className="space-y-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Tap any option below to set or customize name:</span>
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {NAME_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setName(preset.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                    name === preset.value
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white hover:bg-emerald-100/70 text-stone-800 border-stone-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Honorific buttons */}
            {name.trim() && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/80">
                <span className="text-xs font-bold text-emerald-800">Add Title:</span>
                {HONORIFICS.map((hon, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setName(hon.apply(name.trim()))}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-xs font-bold cursor-pointer"
                  >
                    {hon.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* If creating a new user profile */}
          {mode === 'create' && (
            <div className="space-y-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="text-sm font-bold uppercase tracking-wider text-stone-700">
                New Account Credentials & Role
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-base font-semibold"
                  >
                    <option value="ELDER">👵 Elder (Senior Citizen)</option>
                    <option value="CAREGIVER">👨‍👩‍👧 Caregiver (Family Member)</option>
                    <option value="ADMIN">🛡️ Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Language
                  </label>
                  <select
                    value={newLang}
                    onChange={e => setNewLang(e.target.value as AppLanguage)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-base font-semibold"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Email Address (Optional — auto-generated if left blank)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. aaji@family.com"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-base"
                />
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-bold text-stone-800 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-stone-800 mb-1">
                Emergency Contact Person
              </label>
              <div className="relative">
                <Heart className="w-5 h-5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Priya (Daughter)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-base"
                />
              </div>
            </div>
          </div>

          {/* Status Feedback Messages */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-xl font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-lg cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg shadow flex items-center gap-2 transition-transform cursor-pointer ${
                isSubmitting || !name.trim()
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-102'
              }`}
            >
              <Save className="w-5 h-5" />
              <span>{isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save User Name' : 'Create & Switch Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
