import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  Search,
  CheckCircle2,
  ExternalLink,
  Info,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { api } from '../services/api';
import { EmergencyContact, ScamAdvisory, ScamReport } from '../types';

export const SafetyPage: React.FC = () => {
  const { language, t } = usePreferences();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [advisories, setAdvisories] = useState<ScamAdvisory[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ScamReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEmergencyContacts().then(res => setContacts(res.contacts || [])).catch(console.warn);
    api.getScamAdvisories().then(res => setAdvisories(res.advisories || [])).catch(console.warn);
  }, []);

  const handleAnalyze = async (sampleText?: string) => {
    const textToScan = sampleText || inputText;
    if (!textToScan.trim()) return;

    if (sampleText) {
      setInputText(sampleText);
    }

    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const res = await api.analyzeScamMessage(textToScan, language);
      setReport(res.report);
    } catch (err: any) {
      setError(err?.message || 'Could not analyze message. If you suspect fraud, dial 1930 immediately.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const SAMPLE_SCAMS = [
    {
      title: 'Electricity Bill Threat SMS',
      text: 'Dear customer, your electricity power will be disconnected at 9:30 PM tonight because your previous month bill was not updated. Please immediately contact power officer at 9876543210.'
    },
    {
      title: 'Digital Arrest Video Call',
      text: 'This is Police Officer Sharma from Delhi Police. A parcel seized in Mumbai in your name contains illegal passports and narcotics. You are under Digital Arrest. Transfer money to our safety verification account immediately.'
    },
    {
      title: 'UPI Lottery Refund PIN Request',
      text: 'Congratulations! You have won ₹25,000 lottery cashback. Click this link and enter your 6-digit secret UPI PIN to receive the money directly into your bank account.'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-amber-900 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-rose-800">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Official Cyber Defense & Senior Safety</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Scam & Fraud Defense Center
          </h1>
          <p className="text-xl text-rose-100 leading-relaxed">
            Protect your hard-earned money and peace of mind. Check suspicious messages before clicking, and know your emergency rights.
          </p>
        </div>
      </div>

      {/* Interactive Scam Scanner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
              <Search className="w-7 h-7 text-emerald-600" />
              <span>{t('scamScannerTitle')}</span>
            </h2>
            <p className="text-lg text-stone-600 mt-1">
              {t('scamScannerDesc')}
            </p>
          </div>
          <AudioSpeakButton text={`${t('scamScannerTitle')}. ${t('scamScannerDesc')}`} />
        </div>

        {/* Input Textarea */}
        <div className="space-y-3">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste suspicious SMS, WhatsApp message, or description of caller pitch here..."
            rows={4}
            className="w-full bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 rounded-2xl p-4 text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none resize-none"
          />

          {/* Quick Sample Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-stone-600">Try common scam test samples:</span>
            {SAMPLE_SCAMS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleAnalyze(s.text)}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => handleAnalyze()}
            disabled={!inputText.trim() || isAnalyzing}
            className={`px-8 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 transition-transform cursor-pointer ${
              inputText.trim() && !isAnalyzing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-102'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
            <span>{isAnalyzing ? 'Scanning with Buddy AI...' : t('scanButton')}</span>
          </button>

          {inputText && (
            <button
              onClick={() => {
                setInputText('');
                setReport(null);
              }}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-base cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Scan Result Report */}
        {report && (
          <div
            className={`mt-6 p-6 sm:p-8 rounded-3xl border-3 shadow-md space-y-6 transition-all ${
              report.riskLevel === 'DANGER_SCAM'
                ? 'bg-rose-50 border-rose-500 text-rose-950'
                : report.riskLevel === 'SUSPICIOUS'
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-emerald-50 border-emerald-500 text-emerald-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-current/20">
              <div className="flex items-center gap-3">
                {report.riskLevel === 'DANGER_SCAM' ? (
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl">
                    !
                  </div>
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                )}
                <div>
                  <div className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
                    {report.riskLevel === 'DANGER_SCAM'
                      ? '⚠️ HIGH RISK: LIKELY FRAUD'
                      : report.riskLevel === 'SUSPICIOUS'
                      ? '⚠️ CAUTION: SUSPICIOUS'
                      : '✅ LIKELY SAFE'}
                  </div>
                  <div className="text-base font-semibold opacity-90">
                    Risk Assessment Score: {report.score} / 100
                  </div>
                </div>
              </div>

              <AudioSpeakButton text={`${report.verdict}. Safe action: ${report.safeAction}`} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-xl mb-1">Buddy's Verdict:</h3>
                <p className="text-xl leading-relaxed whitespace-pre-wrap">{report.verdict}</p>
              </div>

              {report.reasons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-lg">Warning Signs Detected:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-lg">
                    {report.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-white/80 rounded-2xl border border-current/30 space-y-2">
                <h4 className="font-black text-xl text-stone-900">Immediate Safe Action to Take:</h4>
                <p className="text-lg text-stone-800 leading-relaxed font-medium">
                  {report.safeAction}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="tel:1930"
                    className="px-4 py-2 bg-rose-600 text-white font-extrabold rounded-xl text-base shadow flex items-center gap-2 hover:bg-rose-700"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dial 1930 Helpline</span>
                  </a>
                  <span className="text-sm text-stone-600 font-semibold">
                    Reference: {report.officialReference}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl">
            {error}
          </div>
        )}
      </section>

      {/* Emergency Helplines Direct Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
          <PhoneCall className="w-7 h-7 text-emerald-600" />
          <span>Official Emergency & Safety Numbers</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-stone-100 text-stone-700">
                    {c.category}
                  </span>
                  <AudioSpeakButton text={`${c.name}. Call number ${c.number}. ${c.description}`} size="sm" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">{c.name}</h3>
                <p className="text-stone-600 text-base">{c.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-3xl font-black text-rose-600 font-mono tracking-wider">
                  {c.number}
                </span>
                <a
                  href={`tel:${c.number}`}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-base shadow flex items-center gap-2 transition-transform hover:scale-102"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call {c.number}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Fraud Advisories & Guidance */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          <span>Current Fraud Advisories & How to Stay Protected</span>
        </h2>

        <div className="space-y-4">
          {advisories.map(adv => (
            <div
              key={adv.id}
              className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-stone-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full">
                  {adv.severity} ALERT
                </span>
                <AudioSpeakButton text={`${adv.title}. ${adv.summary}. Golden rule: ${adv.safetyRule}`} size="sm" />
              </div>

              <h3 className="text-2xl font-bold text-stone-900">{adv.title}</h3>
              <p className="text-lg text-stone-600 leading-relaxed">{adv.summary}</p>

              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-950">
                <strong className="text-lg">Senior Safety Rule: </strong>
                <span className="text-lg">{adv.safetyRule}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
