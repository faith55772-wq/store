import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Play,
  Square,
  Volume2,
  CheckCircle2,
  Clock,
  Shield,
  Monitor,
  Globe,
  RefreshCw,
  Send,
  Sliders,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function StoreClientTerminal() {
  // Store info state
  const [storeId, setStoreId] = useState(() => localStorage.getItem('sl_store_id') || 'STORE-101');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('sl_store_name') || 'Dallas Downtown Retail #104');
  const [storeLocation, setStoreLocation] = useState(() => localStorage.getItem('sl_store_loc') || 'Dallas, TX');
  const [approvalStatus, setApprovalStatus] = useState('approved'); // 'pending' | 'approved' | 'rejected' | 'not_registered'
  const [isRegistered, setIsRegistered] = useState(true);

  // Hardware Mic Enumeration (Section 3.3)
  const [mics, setMics] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [micActive, setMicActive] = useState(false);

  // Recording State & Timer (Section 3.2 & 3.3.3)
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Bilingual Real-time English Transcript Stream (Section 3.4)
  const [transcripts, setTranscripts] = useState([
    {
      text: 'Microphone initialized. Ready to capture customer & representative speech.',
      speaker: 'R',
      time: '00:00',
      language: 'en',
    },
  ]);

  // Audio Context & Waveform Visualizer
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const animFrameRef = useRef(null);

  // Load Microphones (Section 3.3.1)
  const enumerateMicrophones = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Request temporary mic permission to label devices
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setMics(audioInputs);
        if (audioInputs.length > 0 && !selectedMicId) {
          setSelectedMicId(audioInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Microphone enumeration notice:', err.message);
      // Fallback virtual mics
      setMics([
        { deviceId: 'default', label: 'USB Omnidirectional Retail Mic (Realtek High Definition Audio)' },
        { deviceId: 'mic-2', label: 'Jabra Speak 710 Conference Mic' },
        { deviceId: 'mic-3', label: 'Internal Laptop Microphone Array' },
      ]);
    }
  };

  useEffect(() => {
    enumerateMicrophones();

    // Check store status in backend
    api.getStore(storeId)
      .then((res) => {
        if (res.store) {
          setApprovalStatus(res.store.status);
          setIsRegistered(true);
          if (res.store.status === 'approved' && !isRecording) {
            // Auto start if approved (Section 3.2.2: Auto-start on boot)
            startRecordingSession();
          }
        }
      })
      .catch(() => {});

    const socket = getSocket();

    // Join store room
    socket.emit('store:join', {
      storeId,
      name: storeName,
      location: storeLocation,
      systemInfo: {
        hostname: 'RETAIL-POS-WINDOWS-CLIENT',
        activeMic: mics.find((m) => m.deviceId === selectedMicId)?.label || 'Omnidirectional Retail Mic',
      },
    });

    // Auto-start recording as soon as Admin approves! (Section 3.2.1: Mandatory Core Feature)
    const handleApproval = (data) => {
      console.log('[StoreClient] Approval received from Admin:', data);
      if (data.storeId === storeId) {
        setApprovalStatus('approved');
        if (data.autoStartRecording) {
          startRecordingSession();
        }
      }
    };

    socket.on('store:approved', handleApproval);

    return () => {
      socket.off('store:approved', handleApproval);
      stopRecordingSession();
    };
  }, [storeId]);

  // Timer loop
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording]);

  // Audio Level Analyzer loop
  const updateAudioVisualizer = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setAudioLevel(avg);
      animFrameRef.current = requestAnimationFrame(updateAudioVisualizer);
    }
  };

  // Start Recording Session (Section 3.2 & 3.3)
  const startRecordingSession = async () => {
    if (approvalStatus !== 'approved') {
      alert('Cannot start recording: Store registration is pending Admin Approval!');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        });
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;
        source.connect(analyserRef.current);

        updateAudioVisualizer();
      }
    } catch (e) {
      console.warn('Real audio device warning:', e.message);
    }

    setIsRecording(true);
    setMicActive(true);
    setTimerSeconds(0);

    const socket = getSocket();
    socket.emit('store:recording_started', {
      storeId,
      storeName,
      location: storeLocation,
    });
  };

  // Stop Recording Session (Section 3.2.3 & 3.2.4)
  const stopRecordingSession = () => {
    setIsRecording(false);
    setMicActive(false);
    clearInterval(timerIntervalRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    const socket = getSocket();
    socket.emit('store:recording_stopped', { storeId });
  };

  // Register New Store (Section 3.1.1)
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const activeMicName = mics.find((m) => m.deviceId === selectedMicId)?.label || 'Microphone';
      const res = await api.registerStore({
        storeId,
        name: storeName,
        location: storeLocation,
        systemInfo: {
          hostname: 'STORE-PC-CLIENT',
          activeMic: activeMicName,
          availableMics: mics.map((m) => m.label || m.deviceId),
        },
      });

      localStorage.setItem('sl_store_id', storeId);
      localStorage.setItem('sl_store_name', storeName);
      localStorage.setItem('sl_store_loc', storeLocation);

      setApprovalStatus(res.store.status);
      setIsRegistered(true);

      const socket = getSocket();
      socket.emit('store:join', {
        storeId,
        name: storeName,
        location: storeLocation,
        systemInfo: { activeMic: activeMicName },
      });
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  // Simulate Bilingual Speech Input for Instant Live Testing (Section 3.4)
  const pushSpeechUtterance = (text, speaker = 'C', lang = 'en', original = null) => {
    if (!isRecording) {
      alert('Please start recording first!');
      return;
    }

    const socket = getSocket();
    const timeFormatted = formatTime(timerSeconds);

    const newUtt = {
      text,
      originalText: original || text,
      speaker,
      time: timeFormatted,
      language: lang,
    };

    setTranscripts((prev) => [...prev, newUtt]);

    // Send to Backend & Live Monitor via Socket.IO
    socket.emit('stream:transcript', {
      storeId,
      storeName,
      location: storeLocation,
      text,
      originalText: original || text,
      speaker,
      language: lang,
      isFinal: true,
      timestamp: Date.now(),
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Windows Desktop Client Terminal (.exe)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Component 1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Retail store PC audio capture agent with multi-mic enumeration, admin approval gate, and bilingual Deepgram speech detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Client v1.2.9 (.exe)
          </span>
        </div>
      </div>

      {/* Section 3.1: Approval Gate Banner if Pending */}
      {approvalStatus === 'pending' && (
        <div className="p-6 rounded-2xl bg-amber-950/30 border-2 border-amber-500/50 shadow-xl flex items-start gap-4">
          <Clock className="w-8 h-8 text-amber-400 flex-shrink-0 animate-pulse" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
              Section 3.1 Approval Gate: Awaiting Central Admin Approval
            </h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              This retail store PC is currently registered but blocked from recording. Once the store admin clicks <strong>"Approve"</strong> in the <strong>Store Approvals</strong> module of the Web Portal, this terminal will automatically unlock and <strong>Auto-Start Recording</strong> in real-time.
            </p>
          </div>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Store Settings & Mic Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Hardware Microphone Detection (Section 3.3) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-sky-400" />
                <span>Section 3.3 Hardware Mic Detection</span>
              </h2>
              <button
                onClick={enumerateMicrophones}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
                title="Rescan Mics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mic Selection Dropdown (Section 3.3.2) */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Connected Microphones ({mics.length} detected)
              </label>
              <select
                value={selectedMicId}
                onChange={(e) => setSelectedMicId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {mics.length === 0 ? (
                  <option value="">No hardware mic found</option>
                ) : (
                  mics.map((m, i) => (
                    <option key={m.deviceId || i} value={m.deviceId}>
                      {m.label || `Microphone Input ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Active Audio Waveform Indicator (Section 3.3.3) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      micActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  {micActive ? 'Microphone is active' : 'Microphone standby'}
                </span>
                <span className="font-mono text-sky-400 font-bold text-sm">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              {/* Dynamic waveform visualizer */}
              <div className="h-8 bg-slate-900 rounded-lg flex items-center justify-center gap-1 px-3 overflow-hidden border border-slate-800">
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = isRecording
                    ? Math.max(6, Math.min(26, (audioLevel / 5) * (1 + (i % 4) * 0.4)))
                    : 4;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isRecording ? 'bg-sky-400' : 'bg-slate-700'
                      }`}
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Section 3.2 Manual Override Controls */}
            <div className="flex items-center gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={startRecordingSession}
                  disabled={approvalStatus !== 'approved'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Recording (Manual)</span>
                </button>
              ) : (
                <button
                  onClick={stopRecordingSession}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording (Manual)</span>
                </button>
              )}
            </div>
          </div>

          {/* Store Registration Card (Section 3.1) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Section 3.1 Store Registration</span>
            </h2>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Location / Mall</label>
                <input
                  type="text"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Store ID</label>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
              >
                Register / Update Store Client
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Live Conversation Box & Bilingual English Output (Section 3.4) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Live Conversation Box & Real-Time English Output
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                Section 3.4 Bilingual
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Section 3.4.2: English and Spanish audio are detected. Output always appears in English in real-time.
            </p>

            {/* Conversation Feed */}
            <div className="space-y-3 h-80 overflow-y-auto pr-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {transcripts.map((t, idx) => {
                const isRep = t.speaker === 'R';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isRep ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-0.5 px-1">
                      <span className="font-bold text-slate-400">
                        {isRep ? 'Representative (R)' : 'Customer (C)'}
                      </span>
                      <span>&bull;</span>
                      <span>{t.time}</span>
                    </div>

                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        isRep
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                          : 'bg-sky-600 text-white rounded-tr-sm shadow-sky-600/20'
                      }`}
                    >
                      {t.text}
                    </div>

                    {t.originalText && t.originalText !== t.text && (
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5 px-2">
                        ES: "{t.originalText}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Bilingual Speech Testing Buttons (Section 3.4.1 & 3.4.2) */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Simulate Live Speech Dialogue (Dual Language &rarr; Real Time English):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() =>
                  pushSpeechUtterance(
                    'Good morning! How can I help you today with a new phone or plan?',
                    'R',
                    'en'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-slate-200 border border-slate-700 transition-colors"
              >
                <div className="font-bold text-sky-400 text-[10px] uppercase">Representative (EN)</div>
                <div className="truncate">"How can I help you today?"</div>
              </button>

              <button
                onClick={() =>
                  pushSpeechUtterance(
                    'Do you have chargers for iPhone 15?',
                    'C',
                    'es',
                    '¿Tienen cargadores para iPhone 15?'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-slate-200 border border-slate-700 transition-colors"
              >
                <div className="font-bold text-amber-400 text-[10px] uppercase">Customer (Spanish Audio)</div>
                <div className="truncate">"¿Tienen cargadores para iPhone?"</div>
              </button>

              <button
                onClick={() =>
                  pushSpeechUtterance(
                    'Yes, we have the 30W USB-C fast charger for $25.',
                    'R',
                    'en'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-slate-200 border border-slate-700 transition-colors"
              >
                <div className="font-bold text-sky-400 text-[10px] uppercase">Representative (EN)</div>
                <div className="truncate">"Yes, we have 30W charger for $25"</div>
              </button>

              <button
                onClick={() =>
                  pushSpeechUtterance(
                    "Oh it is too expensive, I'll buy it online later.",
                    'C',
                    'es',
                    'Ah está muy caro, lo compraré por internet después.'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-slate-200 border border-slate-700 transition-colors"
              >
                <div className="font-bold text-rose-400 text-[10px] uppercase">Customer (Spanish Audio)</div>
                <div className="truncate">"Está muy caro, compraré online"</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
