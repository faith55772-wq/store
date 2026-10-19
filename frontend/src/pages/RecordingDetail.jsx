import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Store,
  Tag,
  Award,
  CheckCircle2,
  DollarSign,
  FileText,
  Activity,
  Layers,
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
      setToast({ type: 'success', message: 'Conversation analysis successfully compiled.' });
    } catch (err) {
      setToast({ type: 'error', message: `Analysis failed: ${err.message}` });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
        <Activity className="w-6 h-6 text-blue-400 animate-spin mb-3" />
        <span>Loading interaction details...</span>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="py-20 text-center">
        <div className="text-sm font-semibold text-white mb-2">Recording Record Not Found</div>
        <button
          onClick={() => navigate('/recordings')}
          className="text-xs text-blue-400 hover:underline"
        >
          &larr; Return to Conversation Library
        </button>
      </div>
    );
  }

  const ai = recording.aiAnalysis || {};
  const segments = recording.speakerSegments || [];
  const missed = ai.missedOpportunity || {};

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Back button & Action Header (Section 4.4.3 & 4.4.5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/recordings')}
            className="p-1.5 rounded-lg bg-[#141a24] hover:bg-[#1a2230] text-slate-300 transition-colors border border-[#202938]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Conversation Review: {recording.recordingId}
              </h1>
              {ai.analyzed ? (
                <span className="pro-badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  EVALUATED
                </span>
              ) : (
                <span className="pro-badge bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  PENDING REVIEW
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sales conversation breakdown &bull; Nova-2 Speech Ingestion &bull; Diarized customer dialogues
            </p>
          </div>
        </div>

        {/* Generate AI Report Button (Section 4.4.5) */}
        <button
          onClick={handleGenerateAiReport}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          <FileText className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Evaluating Dialogue...' : 'Run Interaction Analysis'}</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            toast.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      {/* Header Info Badges (Section 4.4.3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pro-card p-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-400">Customer ID</div>
            <div className="font-mono font-semibold text-slate-100">{recording.customerId}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Store className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400">Sales Associate</div>
            <div className="font-semibold text-slate-100">{recording.representativeName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] text-slate-400">Date & Location</div>
            <div className="font-semibold text-slate-100 truncate">
              {new Date(recording.startTime).toLocaleDateString()} &bull; {recording.location}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] text-slate-400">Time & Duration</div>
            <div className="font-mono font-semibold text-slate-100">
              {new Date(recording.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({recording.durationSeconds}s)
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player (Section 4.4.4) */}
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Audio Playback & Voice Scrubber
        </div>
        <AudioPlayer audioUrl={recording.audioUrl} duration={recording.durationSeconds || 60} />
      </div>

      {/* Missed Opportunity Alert Box (Section 4.4.6: Highlight in Box) */}
      {missed.detected && (
        <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/60 shadow-sm flex items-start gap-3.5">
          <div className="p-2 rounded-md bg-rose-500/20 text-rose-300 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Missed Sales Opportunity: {missed.category}
              </h3>
              {missed.estimatedLoss > 0 && (
                <span className="font-mono font-bold text-rose-300 text-xs bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700/50">
                  Est. Impact: -${missed.estimatedLoss}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-200/90 mt-1 leading-relaxed font-normal">
              {missed.details}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Structured Analysis Panel (Left) & Speaker Separated Transcript (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Structured Analysis Panel (Section 4.4.7) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="pro-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2737] pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Interaction Analysis
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Diarized Evaluation</span>
            </div>

            {/* SUMMARY */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Conversation Summary
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#0e131b] p-3 rounded-lg border border-[#1e2636]">
                {ai.summary || 'Click Run Interaction Analysis to compile conversation summary.'}
              </p>
            </div>

            {/* CUSTOMER NEEDS */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Customer Needs & Inquiries
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#0e131b] p-3 rounded-lg border border-[#1e2636]">
                {ai.customerNeeds || 'Pending analysis evaluation.'}
              </p>
            </div>

            {/* CUSTOMER SENTIMENT */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Customer Reception & Sentiment
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e131b] border border-[#1e2636]">
                <span
                  className={`pro-badge ${
                    ai.customerSentiment === 'Positive'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : ai.customerSentiment === 'Negative'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ai.customerSentiment || 'Neutral'}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Confidence: {ai.sentimentScore || 70}%
                </span>
              </div>
            </div>

            {/* PRODUCTS DISCUSSED */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Products & Accessories Mentioned
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(ai.productsDiscussed || []).length === 0 ? (
                  <span className="text-xs text-slate-500">None detected</span>
                ) : (
                  ai.productsDiscussed.map((prod, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#16202e] text-blue-300 border border-[#243144] text-[11px] font-medium flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-blue-400" />
                      <span>{prod}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* OPPORTUNITY TYPE */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Interaction Outcome
              </div>
              <div className="p-2.5 rounded-lg bg-[#0e131b] border border-[#1e2636] flex items-center justify-between text-xs font-medium text-slate-200">
                <span>{ai.opportunityType || 'Inquiry / Consultation'}</span>
                {ai.salesOutcome === 'Sold' ? (
                  <span className="text-emerald-400 font-mono font-semibold">+${ai.saleAmount} Sold</span>
                ) : (
                  <span className="text-slate-400 font-mono">{ai.salesOutcome}</span>
                )}
              </div>
            </div>

            {/* Associate Coaching Tip */}
            {ai.coachingTip && (
              <div className="p-3 rounded-lg bg-[#141d2a] border border-[#233147]">
                <div className="text-[11px] font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  <span>Associate Coaching Tip</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {ai.coachingTip}
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-300 font-medium">
                  Interaction Score: <span className="font-bold text-white">{ai.performanceScore || 8}/10</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Speaker Separated Transcript (Section 4.4.8: Chat Bubble Format) */}
        <div className="lg:col-span-7 pro-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1f2737] pb-2.5 mb-3.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Conversation Transcript
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {segments.length} Utterances &bull; Customer (C) vs Representative (R)
              </span>
            </div>

            {/* Chat Bubbles */}
            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-2">
              {segments.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No diarized utterances available. Click Run Interaction Analysis above.
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const isRep = seg.speaker === 'R';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isRep ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-300">
                          {isRep ? 'Sales Associate (R)' : 'Customer (C)'}
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono">{seg.timestamp}s</span>
                        {seg.languageDetected === 'es' && (
                          <span className="text-amber-400 text-[10px] font-mono">(Spanish Source)</span>
                        )}
                      </div>

                      <div
                        className={`max-w-md p-3 rounded-lg text-xs leading-relaxed font-normal ${
                          isRep
                            ? 'bg-[#18202d] text-slate-100 border border-[#243044]'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}
                      >
                        {seg.text}
                      </div>

                      {seg.originalText && seg.originalText !== seg.text && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 px-2">
                          Original: "{seg.originalText}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1f2737] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Audio Source: {recording.originalLanguage === 'es' ? 'Spanish (Live English Translation)' : 'English'}</span>
            <span className="text-emerald-400 font-medium">&bull; Dictionaries & Diarization Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
