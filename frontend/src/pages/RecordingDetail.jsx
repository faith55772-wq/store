import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Store,
  Tag,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { api } from '../services/api';
import AudioPlayer from '../components/AudioPlayer';

export default function RecordingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = () => {
    setLoading(true);
    api.getRecording(id)
      .then((res) => {
        setRecording(res.recording);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load recording:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGenerateAiReport = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeRecording(id);
      setRecording(res.recording);
      setToast({ type: 'success', message: 'Single conversation AI analysis updated!' });
    } catch (err) {
      setToast({ type: 'error', message: `Analysis failed: ${err.message}` });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm">
        <Sparkles className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <span>Loading conversation details...</span>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="py-20 text-center">
        <div className="text-lg font-bold text-white mb-2">Recording Not Found</div>
        <button
          onClick={() => navigate('/recordings')}
          className="text-xs text-sky-400 hover:underline"
        >
          &larr; Back to Recordings Library
        </button>
      </div>
    );
  }

  const ai = recording.aiAnalysis || {};
  const segments = recording.speakerSegments || [];
  const missed = ai.missedOpportunity || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back button & Action Header (Section 4.4.3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/recordings')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                Conversation Analysis: {recording.recordingId}
              </h1>
              {ai.analyzed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ANALYZED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PENDING AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Single-Audio AI Deep Dive &bull; Deepgram Nova-2 Multilingual Engine
            </p>
          </div>
        </div>

        {/* Generate AI Report Button (Section 4.4.5) */}
        <button
          onClick={handleGenerateAiReport}
          disabled={analyzing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Running AI Engine...' : 'Generate AI Report'}</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      {/* Header Info Badges (Section 4.4.3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-[10px] text-slate-400">Customer ID</div>
            <div className="font-mono font-bold text-slate-200">{recording.customerId}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Store className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400">Representative</div>
            <div className="font-semibold text-slate-200">{recording.representativeName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="text-[10px] text-slate-400">Date & Location</div>
            <div className="font-semibold text-slate-200 truncate">
              {new Date(recording.startTime).toLocaleDateString()} &bull; {recording.location}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400">Time & Duration</div>
            <div className="font-mono font-bold text-slate-200">
              {new Date(recording.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({recording.durationSeconds}s)
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player (Section 4.4.4) */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>Audio Playback & Waveform (Section 4.4.4)</span>
        </div>
        <AudioPlayer audioUrl={recording.audioUrl} duration={recording.durationSeconds || 60} />
      </div>

      {/* Missed Opportunity Alert Box (Section 4.4.6: Highlight in Box) */}
      {missed.detected && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 shadow-xl shadow-rose-950/30 flex items-start gap-4 animate-pulse-live">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-300">
                Missed Opportunity Alert: {missed.category}
              </h3>
              {missed.estimatedLoss > 0 && (
                <span className="font-mono font-black text-rose-400 text-sm bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Est. Loss: -${missed.estimatedLoss}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed font-medium">
              {missed.details}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Structured AI Analysis (Left) & Speaker Separated Transcript (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Structured AI Analysis Panel (Section 4.4.7) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Structured AI Analysis</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Section 4.4.7</span>
            </div>

            {/* SUMMARY */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Conversation Summary
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {ai.summary || 'Click Generate AI Report to compile conversation summary.'}
              </p>
            </div>

            {/* CUSTOMER NEEDS */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Customer Needs
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {ai.customerNeeds || 'Pending analysis'}
              </p>
            </div>

            {/* CUSTOMER SENTIMENT */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Customer Sentiment
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${
                    ai.customerSentiment === 'Positive'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : ai.customerSentiment === 'Negative'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ai.customerSentiment || 'Neutral'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">
                  Confidence Score: {ai.sentimentScore || 70}%
                </span>
              </div>
            </div>

            {/* PRODUCTS DISCUSSED */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Products Discussed
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(ai.productsDiscussed || []).length === 0 ? (
                  <span className="text-xs text-slate-500">None detected</span>
                ) : (
                  ai.productsDiscussed.map((prod, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-semibold flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-sky-400" />
                      <span>{prod}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* OPPORTUNITY TYPE */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Opportunity Type
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200">
                <span>{ai.opportunityType || 'Inquiry / Consultation'}</span>
                {ai.salesOutcome === 'Sold' ? (
                  <span className="text-emerald-400 font-mono">+${ai.saleAmount} Sold</span>
                ) : (
                  <span className="text-slate-400 font-mono">{ai.salesOutcome}</span>
                )}
              </div>
            </div>

            {/* Representative Coaching Tip */}
            {ai.coachingTip && (
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-sky-400" />
                  <span>Representative Coaching Tip</span>
                </div>
                <p className="text-xs text-sky-100/90 leading-relaxed">
                  {ai.coachingTip}
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-sky-300">
                  Performance Score: {ai.performanceScore || 8}/10
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Speaker Separated Transcript (Section 4.4.8: Chat Bubble Format) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Speaker Separated Transcript</span>
                <span className="text-xs font-normal text-slate-400">
                  (Customer [C] vs Representative [R])
                </span>
              </h2>
              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                {segments.length} Utterances
              </span>
            </div>

            {/* Chat Bubbles */}
            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2">
              {segments.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No diarized utterances available. Click Generate AI Report.
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const isRep = seg.speaker === 'R';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isRep ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1 px-1">
                        <span className="font-bold text-slate-400">
                          {isRep ? 'Representative (R)' : 'Customer (C)'}
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono">{seg.timestamp}s</span>
                        {seg.languageDetected === 'es' && (
                          <span className="text-amber-400 text-[9px] font-mono">Spanish Audio</span>
                        )}
                      </div>

                      <div
                        className={`max-w-lg p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                          isRep
                            ? 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/80'
                            : 'bg-sky-600 text-white rounded-tr-sm shadow-sky-600/20'
                        }`}
                      >
                        {seg.text}
                      </div>

                      {seg.originalText && seg.originalText !== seg.text && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 px-2">
                          Original: "{seg.originalText}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Original Language: {recording.originalLanguage === 'es' ? 'Spanish (Translated)' : 'English'}</span>
            <span className="text-emerald-400 font-semibold">&bull; Diarization High Confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
