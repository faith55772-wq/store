import React, { useEffect, useState, useRef } from 'react';
import {
  Radio,
  Store,
  Mic,
  Activity,
  Volume2,
  Globe,
  Wifi,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function LiveMonitor() {
  const [activeStreams, setActiveStreams] = useState({});
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const streamEndRef = useRef(null);

  useEffect(() => {
    // Fetch all stores to initialize monitor cards
    api.getStores('approved')
      .then((res) => {
        const initial = {};
        (res.stores || []).forEach((s) => {
          initial[s.storeId] = {
            storeId: s.storeId,
            name: s.name,
            location: s.location,
            activeMic: s.systemInfo?.activeMic || 'Hardware Microphone',
            status: s.isRecording ? 'LIVE' : 'ENDED',
            transcripts: s.isRecording
              ? [
                  {
                    text: 'Active live stream connected. Listening for customer dialogues in real time...',
                    speaker: 'R',
                    time: 'Just now',
                    language: 'en',
                  },
                ]
              : [
                  {
                    text: 'Session ended. Standby for next conversation or computer startup.',
                    speaker: 'R',
                    time: 'Standby',
                    language: 'en',
                  },
                ],
            lastActive: new Date(),
          };
        });
        setActiveStreams(initial);
        if (Object.keys(initial).length > 0) {
          setSelectedStoreId(Object.keys(initial)[0]);
        }
      })
      .catch((err) => console.error('Failed to load stores:', err));

    const socket = getSocket();

    // Join Admin Monitor Room
    socket.emit('admin:join_monitor');

    // Handle stream status change: LIVE (green) vs ENDED (red)
    const handleStatusChange = (data) => {
      console.log('[LiveMonitor] Status change:', data);
      setActiveStreams((prev) => {
        const existing = prev[data.storeId] || {
          storeId: data.storeId,
          name: data.storeName || 'Store Location',
          location: data.location || 'United States',
          transcripts: [],
        };

        return {
          ...prev,
          [data.storeId]: {
            ...existing,
            status: data.status, // 'LIVE' or 'ENDED'
            lastActive: new Date(),
          },
        };
      });
    };

    // Handle incoming synchronized word-for-word live transcription in English
    const handleLiveWord = (data) => {
      setActiveStreams((prev) => {
        const existing = prev[data.storeId] || {
          storeId: data.storeId,
          name: data.storeName || 'Store Location',
          location: data.location || 'United States',
          transcripts: [],
        };

        const newTranscripts = [...(existing.transcripts || [])];
        const lastItem = newTranscripts[newTranscripts.length - 1];

        if (lastItem && !lastItem.isFinal && lastItem.speaker === data.speaker) {
          // Update interim text
          lastItem.text = data.text;
          lastItem.isFinal = data.isFinal;
        } else {
          newTranscripts.push({
            text: data.text,
            originalText: data.originalText,
            speaker: data.speaker || 'R',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            language: data.languageDetected || 'en',
            isFinal: data.isFinal,
          });
        }

        return {
          ...prev,
          [data.storeId]: {
            ...existing,
            status: 'LIVE',
            transcripts: newTranscripts.slice(-50), // keep latest 50
            lastActive: new Date(),
          },
        };
      });
    };

    socket.on('stream:status_change', handleStatusChange);
    socket.on('stream:live_word', handleLiveWord);

    return () => {
      socket.off('stream:status_change', handleStatusChange);
      socket.off('stream:live_word', handleLiveWord);
    };
  }, []);

  // Auto-scroll transcript feed
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeStreams, selectedStoreId]);

  const streamList = Object.values(activeStreams);
  const activeFocusStore = activeStreams[selectedStoreId] || streamList[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Global Stream Live Monitor
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live"></span>
              Synchronized WebSocket
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 4.2: Real-time word-for-word English transcription stream and instant LIVE / ENDED status badge telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Streams: {streamList.filter((s) => s.status === 'LIVE').length} Live</span>
          </div>
        </div>
      </div>

      {/* Grid of Stores Stream Listener Cards (Section 4.2.1 & 4.2.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {streamList.map((st) => {
          const isLive = st.status === 'LIVE';
          const isSelected = selectedStoreId === st.storeId;

          return (
            <div
              key={st.storeId}
              onClick={() => setSelectedStoreId(st.storeId)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-slate-900 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-400">{st.storeId}</span>
                {/* Section 4.2.3: LIVE vs ENDED Badge */}
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live"></span>
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    ENDED
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="font-extrabold text-sm text-white truncate">{st.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Store className="w-3 h-3 text-sky-400" />
                  <span className="truncate">{st.location}</span>
                </div>
              </div>

              {/* Hardware Mic and VU animation */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[150px]">
                  <Mic className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span className="truncate text-[11px]">{st.activeMic || 'Microphone Active'}</span>
                </div>

                {isLive && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Focus Live Monitor Card with Synchronized Word-for-Word Transcript (Section 4.2.4) */}
      {activeFocusStore && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white">{activeFocusStore.name}</h2>
                {activeFocusStore.status === 'LIVE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/30">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-live"></span>
                    STREAMING LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    SESSION ENDED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{activeFocusStore.location}</span>
                <span>&bull;</span>
                <span className="font-mono text-sky-400">{activeFocusStore.storeId}</span>
                <span>&bull;</span>
                <span>{activeFocusStore.activeMic}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                <span>Bilingual Real-Time Translation &rarr; English</span>
              </span>
            </div>
          </div>

          {/* Transcript Feed (Word-for-Word Real Time English Stream) */}
          <div className="p-6 h-96 overflow-y-auto space-y-3 bg-slate-950/40">
            {(!activeFocusStore.transcripts || activeFocusStore.transcripts.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Activity className="w-8 h-8 mb-2 opacity-50 animate-pulse" />
                <span>Waiting for speech input from retail microphone...</span>
              </div>
            ) : (
              activeFocusStore.transcripts.map((t, idx) => {
                const isRep = t.speaker === 'R';
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
                      <span>{t.time}</span>
                      {t.originalText && t.originalText !== t.text && (
                        <span className="text-amber-400 font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Translated from Spanish
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isRep
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                          : 'bg-sky-600 text-white rounded-tr-sm shadow-sky-600/20'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={streamEndRef} />
          </div>

          {/* Real-time Subtitle Ticker Bar */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-300 truncate">
              <span className="flex-shrink-0 px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-bold text-[10px]">
                LIVE WORDS
              </span>
              <span className="italic truncate text-slate-300">
                {activeFocusStore.transcripts?.[activeFocusStore.transcripts.length - 1]?.text ||
                  'Audio channel synchronized with Deepgram Nova-2 engine.'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-shrink-0 ml-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Ultra-low Latency: &lt;120ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
