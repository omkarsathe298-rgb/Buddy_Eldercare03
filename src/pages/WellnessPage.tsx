import React, { useState, useEffect } from 'react';
import {
  Activity,
  Droplet,
  Footprints,
  Moon,
  Pill,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { api } from '../services/api';
import { WellnessCheckin } from '../types';

export const WellnessPage: React.FC = () => {
  const { t } = usePreferences();
  const [checkins, setCheckins] = useState<WellnessCheckin[]>([]);
  const [waterCount, setWaterCount] = useState(4);
  const [stepCount, setStepCount] = useState(1500);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'calm' | 'tired' | 'sad' | 'unwell'>('happy');
  const [medsTaken, setMedsTaken] = useState(true);
  const [sleepHours, setSleepHours] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    try {
      const res = await api.getCheckins();
      setCheckins(res.checkins || []);

      const todayEntry = res.checkins?.find(c => c.date === todayStr);
      if (todayEntry) {
        setWaterCount(todayEntry.waterGlasses);
        setStepCount(todayEntry.stepsTaken);
        setSelectedMood(todayEntry.mood);
        setMedsTaken(todayEntry.medicationTaken);
        if (todayEntry.sleepHours) setSleepHours(todayEntry.sleepHours);
        if (todayEntry.notes) setNotes(todayEntry.notes);
        setIsSaved(true);
      }
    } catch (err) {
      console.warn('Failed to load checkins:', err);
    }
  };

  const handleSaveCheckin = async () => {
    try {
      await api.saveCheckin({
        date: todayStr,
        mood: selectedMood,
        waterGlasses: waterCount,
        stepsTaken: stepCount,
        sleepHours,
        medicationTaken: medsTaken,
        notes
      });
      setIsSaved(true);
      loadCheckins();
    } catch (err) {
      console.warn('Failed to save checkin:', err);
    }
  };

  const MOOD_OPTIONS: { id: 'happy' | 'calm' | 'tired' | 'sad' | 'unwell'; label: string; icon: string }[] = [
    { id: 'happy', label: 'Feeling Great', icon: '😊' },
    { id: 'calm', label: 'Peaceful & Calm', icon: '😌' },
    { id: 'tired', label: 'A Bit Tired', icon: '🥱' },
    { id: 'unwell', label: 'Unwell / Rest Needed', icon: '🤒' }
  ];

  const FALL_PREVENTION_TIPS = [
    {
      title: 'Adequate Night Light',
      desc: 'Keep a small night-light on in your bedroom hallway and bathroom to prevent tripping in the dark.'
    },
    {
      title: 'Stable Footwear with Grip',
      desc: 'Wear well-fitted shoes or non-slip slippers inside the home instead of walking in smooth socks on tiles.'
    },
    {
      title: 'Clear Walkways',
      desc: 'Ensure electrical wires, telephone cables, and loose floor rugs are removed from pathways.'
    },
    {
      title: 'Take Your Time Standing Up',
      desc: 'When waking up, sit on the edge of the bed for 30 seconds before standing to let blood pressure equalize.'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white/10 rounded-2xl text-teal-300">
              <Activity className="w-8 h-8" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Daily Wellness & Mood Check-In
            </h1>
          </div>
          <p className="text-xl text-teal-100 leading-relaxed">
            Record your daily water, light walking, morning mood, and view simple tips for safe, healthy independent living.
          </p>
        </div>
      </div>

      {/* Medical Disclaimer Notice */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-base flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Educational & Wellness Notice: </strong>
          Buddy provides gentle habit tracking and safety education. This application does not diagnose illnesses or replace consultation with your doctor or physician.
        </div>
      </div>

      {/* Today's Check-in Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-900">
              Today's Check-In ({new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
            </h2>
          </div>
          {isSaved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saved for Today</span>
            </span>
          )}
        </div>

        {/* 1. How are you feeling today? */}
        <div className="space-y-3">
          <label className="block text-xl font-extrabold text-stone-900">
            1. How are you feeling today?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMood(m.id);
                  setIsSaved(false);
                }}
                className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  selectedMood === m.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-400 bg-white text-stone-700'
                }`}
              >
                <span className="text-4xl">{m.icon}</span>
                <span className="text-base">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Water Hydration Counter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <Droplet className="w-6 h-6 text-sky-500" />
              <span>2. Glasses of Water Drank Today</span>
            </label>
            <span className="text-2xl font-black text-sky-700 font-mono">
              {waterCount} glasses
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setWaterCount(Math.max(0, waterCount - 1));
                setIsSaved(false);
              }}
              className="w-14 h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-2xl flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <div className="flex-1 grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setWaterCount(idx + 1);
                    setIsSaved(false);
                  }}
                  className={`h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                    idx < waterCount
                      ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                      : 'bg-stone-100 border-stone-200 text-stone-400'
                  }`}
                >
                  <Droplet className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setWaterCount(waterCount + 1);
                setIsSaved(false);
              }}
              className="w-14 h-14 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-2xl flex items-center justify-center shadow cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* 3. Steps Walked */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <Footprints className="w-6 h-6 text-emerald-600" />
              <span>3. Walking / Activity Steps</span>
            </label>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {stepCount.toLocaleString()} steps
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[500, 1000, 2000, 3000, 5000].map(s => (
              <button
                key={s}
                onClick={() => {
                  setStepCount(s);
                  setIsSaved(false);
                }}
                className={`px-4 py-2 rounded-xl text-base font-bold border-2 cursor-pointer transition-colors ${
                  stepCount === s
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {s.toLocaleString()} steps
              </button>
            ))}
          </div>
        </div>

        {/* 4. Morning / Evening Medication Taken */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pill className="w-7 h-7 text-emerald-600" />
            <div>
              <div className="text-xl font-extrabold text-stone-900">
                Prescribed Medication Taken
              </div>
              <div className="text-sm text-stone-600">
                Mark your daily tablets or prescribed drops
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setMedsTaken(!medsTaken);
              setIsSaved(false);
            }}
            className={`px-6 py-3 rounded-xl font-bold text-lg border-2 transition-colors cursor-pointer ${
              medsTaken
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            {medsTaken ? '✓ Taken Today' : 'Not Taken Yet'}
          </button>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={handleSaveCheckin}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl rounded-2xl shadow-lg transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Save Today's Check-in</span>
          </button>
        </div>
      </div>

      {/* Fall Prevention & Safe Mobility Education */}
      <section className="bg-stone-50 rounded-3xl p-6 sm:p-8 border-2 border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Fall Prevention & Home Safety Tips
          </h2>
          <AudioSpeakButton
            text="Fall Prevention Tips: Keep adequate night light in hallways. Wear non-slip footwear. Clear loose rugs and wires. Take thirty seconds sitting on the bed before standing up."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FALL_PREVENTION_TIPS.map((tip, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
              <h3 className="text-xl font-bold text-stone-900">{tip.title}</h3>
              <p className="text-stone-600 text-base leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
