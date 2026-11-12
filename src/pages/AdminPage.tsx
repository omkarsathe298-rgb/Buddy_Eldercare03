import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  BookOpen,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { KnowledgeSource, GeminiStatus } from '../types';

export const AdminPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<GeminiStatus | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<any[]>([]);

  // Ingestion form state
  const [newTitle, setNewTitle] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('scam_prevention');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [ingestSuccess, setIngestSuccess] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      const res = await api.getAdminStats();
      setStats(res.stats);
      setModelStatus(res.modelStatus);
    } catch {
      // If unauthorized, fetch public status
      api.getGeminiStatus().then(setModelStatus).catch(console.warn);
    }

    try {
      const kRes = await api.getKnowledgeSources();
      setSources(kRes.sources || []);
    } catch (err) {
      console.warn('Failed to load sources:', err);
    }
  };

  const handleProbeModels = async () => {
    setIsProbing(true);
    setProbeResult(null);
    try {
      const res = await api.probeGeminiModel();
      setProbeResult(res);
      loadAdminData();
    } catch (err: any) {
      setProbeResult({ success: false, error: err?.message || 'Probe failed' });
    } finally {
      setIsProbing(false);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSearchQuery.trim()) return;
    try {
      const res = await api.searchKnowledge(testSearchQuery);
      setTestSearchResults(res.results || []);
    } catch (err) {
      console.warn('Test search error:', err);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPublisher || !newUrl || !newSummary || !newContent) return;

    try {
      await api.addKnowledgeSource({
        title: newTitle,
        publisher: newPublisher,
        url: newUrl,
        category: newCategory,
        summary: newSummary,
        content: newContent
      });
      setIngestSuccess(true);
      setNewTitle('');
      setNewPublisher('');
      setNewUrl('');
      setNewSummary('');
      setNewContent('');
      loadAdminData();
      setTimeout(() => setIngestSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to add source:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-800">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white/10 rounded-2xl text-emerald-400">
              <LayoutDashboard className="w-8 h-8" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Admin & System Intelligence Console
            </h1>
          </div>
          <p className="text-xl text-stone-300 leading-relaxed">
            Monitor real-time Gemini model health, test RAG knowledge retrieval, and manage verified digital literacy sources.
          </p>
        </div>
      </div>

      {/* Role Notice Switcher */}
      {user?.role !== 'ADMIN' && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>
              You are currently logged in as <strong>{user?.name} ({user?.role})</strong>.
            </span>
          </div>
          <button
            onClick={() => switchRole('ADMIN')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm cursor-pointer"
          >
            Switch to Admin Role (Dr. Anand Joshi)
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-stone-200">
            <div className="text-xs font-bold text-stone-600 uppercase">Registered Users</div>
            <div className="text-3xl font-black text-stone-900 mt-1">{stats.totalUsers}</div>
            <div className="text-xs text-stone-600 mt-0.5">{stats.eldersCount} Elders • {stats.caregiversCount} Caregivers</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-stone-200">
            <div className="text-xs font-bold text-stone-600 uppercase">Total Conversations</div>
            <div className="text-3xl font-black text-emerald-700 mt-1">{stats.totalConversations}</div>
            <div className="text-xs text-stone-600 mt-0.5">{stats.totalMessages} Messages Exchanged</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-stone-200">
            <div className="text-xs font-bold text-stone-600 uppercase">Wellness Check-ins</div>
            <div className="text-3xl font-black text-teal-700 mt-1">{stats.totalCheckins}</div>
            <div className="text-xs text-stone-600 mt-0.5">Hydration & steps tracked</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-stone-200">
            <div className="text-xs font-bold text-stone-600 uppercase">Verified Sources</div>
            <div className="text-3xl font-black text-amber-700 mt-1">{stats.totalKnowledgeSources}</div>
            <div className="text-xs text-stone-600 mt-0.5">CERT-In, RBI, NPCI Grounding</div>
          </div>
        </div>
      )}

      {/* Gemini AI Live Status & Discovery Probe */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <span>Gemini AI Engine & Model Discovery</span>
            </h2>
            <p className="text-stone-600 text-base">
              Verifies actual generation access and prevents model availability errors.
            </p>
          </div>

          <button
            onClick={handleProbeModels}
            disabled={isProbing}
            className={`px-5 py-2.5 rounded-xl font-bold text-base flex items-center gap-2 shadow cursor-pointer ${
              isProbing
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${isProbing ? 'animate-spin' : ''}`} />
            <span>{isProbing ? 'Probing Models...' : 'Probe & Verify Models'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="text-xs font-bold uppercase text-stone-600">Active Model</div>
            <div className="text-xl font-black text-emerald-700 font-mono mt-1">
              {modelStatus?.activeModel || 'gemini-3.8-flash'}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              Status: {modelStatus?.isVerified ? '✅ Live Verified' : 'Awaiting Probe'}
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="text-xs font-bold uppercase text-stone-600">API Key Configured</div>
            <div className="text-xl font-black text-stone-900 mt-1">
              {modelStatus?.hasApiKey ? 'Yes (Server-Side)' : 'Using Safe Fallback'}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              User-Agent: 'aistudio-build'
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="text-xs font-bold uppercase text-stone-600">Supported Fallback Hierarchy</div>
            <div className="text-sm font-semibold text-stone-800 mt-1 font-mono">
              gemini-3.8-flash → gemini-3.1-flash-lite
            </div>
            <div className="text-xs text-stone-600 mt-1">
              Official Google Gen AI SDK
            </div>
          </div>
        </div>

        {probeResult && (
          <div className="p-4 bg-stone-900 text-stone-100 rounded-2xl text-sm font-mono space-y-2">
            <div className="text-emerald-400 font-bold">Probe Execution Report:</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(probeResult, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* RAG Knowledge Retrieval Inspector */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-teal-600" />
            <span>RAG Knowledge Retrieval Test Sandbox</span>
          </h2>
          <p className="text-stone-600 text-base">
            Test how Buddy retrieves verified government chunks (CERT-In, RBI, NPCI) for any user question.
          </p>
        </div>

        <form onSubmit={handleTestSearch} className="flex gap-3">
          <input
            type="text"
            value={testSearchQuery}
            onChange={e => setTestSearchQuery(e.target.value)}
            placeholder="e.g. Someone is asking for my OTP or UPI PIN"
            className="flex-1 bg-stone-50 border-2 border-stone-300 rounded-xl px-4 py-3 text-base focus:outline-teal-600"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow cursor-pointer flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span>Test Retrieval</span>
          </button>
        </form>

        {testSearchResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-stone-800">Retrieved Chunks & Grounding Sources:</h3>
            {testSearchResults.map((res, idx) => (
              <div key={idx} className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <span>Source: {res.source.publisher} - "{res.source.title}"</span>
                  <span className="bg-teal-200 text-teal-900 px-2 py-0.5 rounded">Score: {res.score}</span>
                </div>
                <p className="text-sm text-stone-800">{res.chunk.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified Knowledge Source Registry */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          <span>Verified Knowledge Source Registry ({sources.length} Active)</span>
        </h2>

        <div className="space-y-4">
          {sources.map(s => (
            <div key={s.id} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-extrabold text-stone-900 text-lg">
                  {s.title}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Trust: {s.trustScore}%
                  </span>
                  <span className="text-xs text-stone-500">
                    Verified: {new Date(s.lastVerified).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-sm text-stone-600">
                Publisher: <strong>{s.publisher}</strong> • Category: <span className="font-mono">{s.category}</span>
              </div>
              <p className="text-base text-stone-700">{s.summary}</p>

              <div className="pt-2 text-xs text-stone-600">
                Contains <strong>{s.chunks.length} indexed chunks</strong> for RAG semantic search.
              </div>
            </div>
          ))}
        </div>

        {/* Add Source Document Form (Admin) */}
        <div className="mt-8 p-6 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-4">
          <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>Ingest New Guidance Document / Authority URL</span>
          </h3>

          <form onSubmit={handleAddSource} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Document / Guide Title"
                className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-base"
                required
              />
              <input
                type="text"
                value={newPublisher}
                onChange={e => setNewPublisher(e.target.value)}
                placeholder="Publisher (e.g. CERT-In / RBI / NPCI)"
                className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="Official Verified URL"
                className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-base"
                required
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-base"
              >
                <option value="scam_prevention">Scam Prevention</option>
                <option value="upi_safety">UPI & Payments Safety</option>
                <option value="whatsapp_guide">WhatsApp & Communications</option>
                <option value="health">Elder Health & Wellness</option>
              </select>
            </div>

            <input
              type="text"
              value={newSummary}
              onChange={e => setNewSummary(e.target.value)}
              placeholder="Short Summary for Senior Guidance"
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-base"
              required
            />

            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Full text content (will be automatically chunked and indexed into the RAG vector/keyword store)..."
              rows={4}
              className="w-full bg-white border border-stone-300 rounded-xl p-3 text-base"
              required
            />

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
            >
              Ingest & Index Knowledge
            </button>

            {ingestSuccess && (
              <span className="ml-3 text-emerald-700 font-bold text-sm">
                ✓ Document ingested and chunked successfully!
              </span>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};
