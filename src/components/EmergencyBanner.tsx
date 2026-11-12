import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, AlertTriangle, X, HeartHandshake } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export const EmergencyBanner: React.FC = () => {
  const { language } = usePreferences();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const textMap = {
    en: {
      alert: 'Emergency & Safety Helplines (24/7 Toll-Free):',
      cyber: 'Cyber Fraud (Stolen Money / Scams):',
      general: 'Police / Medical Emergency:',
      elder: 'Elder Line Support:'
    },
    hi: {
      alert: 'आपातकालीन एवं सुरक्षा हेल्पलाइन (24/7 निःशुल्क):',
      cyber: 'साइबर धोखाधड़ी (पैसे की ठगी):',
      general: 'पुलिस / चिकित्सा आपातकाल:',
      elder: 'वरिष्ठ नागरिक हेल्पलाइन:'
    },
    mr: {
      alert: 'तातडीच्या मदतीसाठी हेल्पलाइन (24/7 मोफत):',
      cyber: 'सायबर फसवणूक (पैसे चोरी/स्कॅम):',
      general: 'पोलीस / वैद्यकीय मदत:',
      elder: 'ज्येष्ठ नागरिक मदत केंद्र:'
    }
  };

  const cur = textMap[language] || textMap.en;

  return (
    <div className="bg-amber-900 text-amber-50 px-4 py-2.5 border-b border-amber-700 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm md:text-base">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="font-semibold text-amber-200">{cur.alert}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cyber Fraud 1930 */}
          <a
            href="tel:1930"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-sm tracking-wide shadow transition-colors"
            title="Dial 1930 for Cyber Crime & Financial Fraud"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>1930</span>
            <span className="text-xs font-normal opacity-90">({cur.cyber.split('(')[0].trim()})</span>
          </a>

          {/* Emergency 112 */}
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-md font-bold text-sm tracking-wide shadow transition-colors"
            title="Dial 112 for Police or Ambulance"
          >
            <PhoneCall className="w-4 h-4 text-stone-950" />
            <span>112</span>
            <span className="text-xs font-medium opacity-85">({cur.general.split('/')[0].trim()})</span>
          </a>

          {/* Elder Line 14567 */}
          <a
            href="tel:14567"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-sm tracking-wide shadow transition-colors"
            title="Dial 14567 for Elder Support"
          >
            <HeartHandshake className="w-4 h-4 text-white" />
            <span>14567</span>
            <span className="text-xs font-normal opacity-90">(Elder Line)</span>
          </a>

          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 hover:bg-amber-800 rounded text-amber-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
