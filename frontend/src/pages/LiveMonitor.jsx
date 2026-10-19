import React, { useEffect, useState, useRef } from 'react';
import {
  Radio,
  Store,
  Mic,
  Volume2,
  Globe,
  Wifi,
  ChevronDown,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function LiveMonitor() {
  const [activeStreams, setActiveStreams] = useState({});
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const streamEndRef = useRef(null);

  useEffect(() => {
    // Fetch authorized stores to initialize stream cards
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
                    text: 'Live audio channel established. Transcribing in English in real time...',
                    speaker: 'R',
                    time: 'Active',
                    language: 'en',
                  },
                ]
              : [
                  {
                    text: 'Session ended. Workstation audio on standby.',
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

    // Join Admin Monitor Room (Section 4.2.1)
    socket.emit('admin:join_monitor');

    // Handle stream status change: LIVE (green) vs ENDED (red) (Section 4.2.3)
    const handleStatusChange = (data) => {
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

    // Handle incoming synchronized word-for-word live transcription in English (Section 4.2.4 & 3.4.2)
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
          newTranscripts[newTranscripts.length - 1] = {
            ...lastItem,
            text: data.text,
            originalText: data.originalText,
            isFinal: data.isFinal,
            language: data.languageDetected,
          };
        } else {
          newTranscripts.push({
            text: data.text,
            originalText: data.originalText,
            speaker: data.speaker || 'R',
            isFinal: data.isFinal || false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            language: data.languageDetected || 'en',
          });
        }

        return {
          ...prev,
          [data.storeId]: {
            ...existing,
            status: 'LIVE',
            transcripts: newTranscripts,
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

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeStreams, selectedStoreId]);

  const streamList = Object.values(activeStreams);
  const currentStream = activeStreams[selectedStoreId] || streamList[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header (Section 4.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Live Conversation Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audio stream monitoring and synchronized bilingual transcription across retail stores.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141a24] border border-[#202938]">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Active Channels: {streamList.filter((s) => s.status === 'LIVE').length}</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Stream Selector Cards (Left) & Active Real-Time Stream (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 Cols): Stream List (Section 4.2.2 & 4.2.3) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Store Terminals
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {streamList.length} Registered
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {streamList.length === 0 ? (
              <div className="pro-card p-6 text-center text-xs text-slate-400">
                No stores registered yet. Please approve a store terminal.
              </div>
            ) : (
              streamList.map((st) => {
                const isSelected = selectedStoreId === st.storeId;
                const isLive = st.status === 'LIVE';

                return (
                  <div
                    key={st.storeId}
                    onClick={() => setSelectedStoreId(st.storeId)}
                    className={`pro-card p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500/50 bg-[#16202e] shadow-sm'
                        : 'hover:border-[#2b374e]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-white truncate">
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {st.location} &bull; <span className="font-mono">{st.storeId}</span>
                        </div>
                      </div>

                      {/* Section 4.2.3: Green LIVE vs Red ENDED Status Badge */}
                      <span
                        className={`pro-badge ${
                          isLive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isLive ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        ></span>
                        {isLive ? 'LIVE' : 'ENDED'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1f2737] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 truncate max-w-[170px]">
                        <Mic className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{st.activeMic}</span>
                      </span>
                      <span>{st.transcripts?.length || 0} Utterances</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 Cols): Synchronized Real-Time Word Stream (Section 4.2.4 & 3.4) */}
        <div className="lg:col-span-8 pro-card p-5 flex flex-col justify-between h-[640px]">
          {currentStream ? (
            <>
              {/* Active Stream Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2737]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      {currentStream.name}
                    </h2>
                    <span
                      className={`pro-badge ${
                        currentStream.status === 'LIVE'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          currentStream.status === 'LIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      ></span>
                      {currentStream.status === 'LIVE' ? 'ACTIVE STREAM' : 'RECORDING ENDED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentStream.location} &bull; Workstation ID: {currentStream.storeId} &bull; Output Language: <span className="text-blue-300 font-medium">English (Real-time Translation)</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-[#0f141d] border border-[#1f2737]">
                  {currentStream.activeMic}
                </div>
              </div>

              {/* Synchronized Word-for-Word Transcription Display (Section 4.2.4 & 3.4) */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-2">
                {(currentStream.transcripts || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Radio className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
                    <span>Awaiting incoming audio dialogues from store workstation...</span>
                  </div>
                ) : (
                  currentStream.transcripts.map((item, idx) => {
                    const isRep = item.speaker === 'R';
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
                          <span className="font-mono">{item.time || 'Live'}</span>
                          {item.language === 'es' && (
                            <span className="text-amber-400 text-[10px] font-mono">
                              (Translated from Spanish)
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-lg p-3 rounded-lg text-xs leading-relaxed ${
                            isRep
                              ? 'bg-[#18212e] text-slate-100 border border-[#243144]'
                              : 'bg-blue-600 text-white shadow-sm'
                          }`}
                        >
                          {item.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={streamEndRef} />
              </div>

              {/* Active Stream Footer Status */}
              <div className="pt-3 border-t border-[#1f2737] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Bilingual Dual-Language Detection (EN + ES) Active</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Sub-second low latency WebSocket synchronization
                </span>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select a store from the left panel to begin monitoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
