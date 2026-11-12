import React, { useState, useEffect } from 'react';
import {
  Users,
  Heart,
  Plus,
  Calendar,
  Activity,
  BookOpen,
  PhoneCall,
  StickyNote,
  Send,
  CheckCircle2,
  Lock,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LinkedElder, CaregiverNote } from '../types';

export const CaregiverPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [elders, setElders] = useState<LinkedElder[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);
  const [newElderEmail, setNewElderEmail] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElders();
  }, [user]);

  const loadElders = async () => {
    try {
      const res = await api.getLinkedElders();
      setElders(res.elders || []);
      if (res.elders && res.elders.length > 0 && !selectedElderId) {
        setSelectedElderId(res.elders[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load linked elders:', err);
    }
  };

  const handleLinkElder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElderEmail.trim()) return;
    setError(null);
    setMessage(null);

    try {
      const res = await api.linkElder(newElderEmail.trim());
      setMessage(res.message);
      setNewElderEmail('');
      loadElders();
    } catch (err: any) {
      setError(err?.message || 'Could not link elder.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElderId || !noteTitle.trim() || !noteContent.trim()) return;
    setError(null);

    try {
      await api.addCaregiverNote(selectedElderId, noteTitle.trim(), noteContent.trim());
      setNoteTitle('');
      setNoteContent('');
      setMessage('Family reminder note added successfully!');
      loadElders();
    } catch (err: any) {
      setError(err?.message || 'Failed to save note');
    }
  };

  const activeElder = elders.find(e => e.id === selectedElderId) || elders[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-teal-900 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white/10 rounded-2xl text-sky-300">
              <Users className="w-8 h-8" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Family & Caregiver Hub
            </h1>
          </div>
          <p className="text-xl text-sky-100 leading-relaxed">
            Stay connected with your senior family members. Check daily wellness status, learning progress, and send caring reminders.
          </p>
        </div>
      </div>

      {/* Role Notice Switcher */}
      {user?.role !== 'CAREGIVER' && user?.role !== 'ADMIN' && (
        <div className="p-4 bg-sky-50 border-2 border-sky-300 rounded-2xl text-sky-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-5 h-5 text-sky-700" />
            <span>
              You are currently viewing as <strong>{user?.name} (Elder)</strong>. To test the full Caregiver experience:
            </span>
          </div>
          <button
            onClick={() => switchRole('CAREGIVER')}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-sm cursor-pointer"
          >
            Switch to Caregiver Role (Priya)
          </button>
        </div>
      )}

      {/* Link New Elder Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-sky-600" />
          <span>Connect with an Elder Family Member</span>
        </h2>
        <p className="text-base text-stone-600">
          Enter the registered email of your parent or family member to link your caregiver dashboard with their consent.
        </p>

        <form onSubmit={handleLinkElder} className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={newElderEmail}
            onChange={e => setNewElderEmail(e.target.value)}
            placeholder="e.g. elder@buddy.com"
            className="flex-1 min-w-[260px] bg-stone-50 border-2 border-stone-300 rounded-xl px-4 py-3 text-lg text-stone-900 focus:outline-sky-600"
          />
          <button
            type="submit"
            className="px-6 py-3.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-lg rounded-xl shadow cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Connect Family Member</span>
          </button>
        </form>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-sm font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Linked Elders Display */}
      {elders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border-2 border-stone-200 text-center space-y-3">
          <Heart className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-xl font-bold text-stone-800">No family members linked yet</h3>
          <p className="text-stone-600 max-w-md mx-auto">
            Use the form above to link with <strong>elder@buddy.com</strong> (Ramesh Sharma) to view wellness checkins.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Elder Selector Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {elders.map(elder => (
              <button
                key={elder.id}
                onClick={() => setSelectedElderId(elder.id)}
                className={`px-5 py-3 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer flex items-center gap-2.5 ${
                  elder.id === activeElder?.id
                    ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>👵 {elder.name}</span>
                <span className="text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  {elder.profile?.city || 'Pune'}
                </span>
              </button>
            ))}
          </div>

          {activeElder && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Status & Checkin History */}
              <div className="lg:col-span-2 space-y-6">
                {/* Elder Profile Summary Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-stone-900">{activeElder.name}</h3>
                      <p className="text-stone-600 text-base">
                        {activeElder.email} • {activeElder.phone || 'No phone recorded'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-sm rounded-full">
                      Linked • Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <div className="text-xs uppercase font-extrabold text-stone-600">Daily Water Goal</div>
                      <div className="text-2xl font-black text-sky-700 mt-1">
                        {activeElder.profile?.waterGoalGlasses || 6} glasses
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <div className="text-xs uppercase font-extrabold text-stone-600">Walking Goal</div>
                      <div className="text-2xl font-black text-emerald-700 mt-1">
                        {activeElder.profile?.dailyGoalSteps || 3000} steps
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <div className="text-xs uppercase font-extrabold text-stone-600">Completed Lessons</div>
                      <div className="text-2xl font-black text-amber-700 mt-1">
                        {activeElder.lessonProgressCount} lessons
                      </div>
                    </div>
                  </div>

                  {activeElder.profile?.medicalNotes && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-base">
                      <strong>Medical & Prescriptions: </strong>
                      {activeElder.profile.medicalNotes}
                    </div>
                  )}
                </div>

                {/* Wellness Checkin History */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
                  <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-emerald-600" />
                    <span>Recent Wellness Check-ins</span>
                  </h3>

                  {activeElder.recentCheckins.length === 0 ? (
                    <p className="text-stone-600">No check-in entries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeElder.recentCheckins.map((chk, i) => (
                        <div
                          key={i}
                          className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-stone-900 text-lg">
                              Date: {chk.date}
                            </div>
                            <div className="text-sm text-stone-600">
                              Mood: <span className="font-semibold capitalize text-stone-800">{chk.mood}</span> • Water: <span className="font-semibold text-sky-700">{chk.waterGlasses} glasses</span> • Steps: <span className="font-semibold text-emerald-700">{chk.stepsTaken}</span>
                            </div>
                            {chk.notes && (
                              <div className="text-sm italic text-stone-700 mt-1">
                                "{chk.notes}"
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              chk.medicationTaken
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {chk.medicationTaken ? 'Meds Taken' : 'Meds Missed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Caregiver Notes & Reminders */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
                  <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <StickyNote className="w-6 h-6 text-sky-600" />
                    <span>Add Reminder Note for {activeElder.name}</span>
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-3">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="Note Title (e.g. Doctor Visit Tuesday)"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base focus:outline-sky-600"
                    />
                    <textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Write reminder or encouraging message..."
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-base focus:outline-sky-600 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!noteTitle.trim() || !noteContent.trim()}
                      className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post Note for Elder</span>
                    </button>
                  </form>

                  {/* Notes Feed */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">
                      Family Notes on Record
                    </h4>
                    {activeElder.notes.length === 0 ? (
                      <p className="text-sm text-stone-500">No notes posted yet.</p>
                    ) : (
                      activeElder.notes.map(n => (
                        <div key={n.id} className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                          <div className="font-bold text-sky-950 text-base">{n.title}</div>
                          <div className="text-sm text-sky-900">{n.content}</div>
                          <div className="text-xs text-sky-600 pt-1">
                            By {n.authorName} • {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
