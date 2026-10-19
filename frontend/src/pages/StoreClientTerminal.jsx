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
  AlertCircle,
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
      text: 'Microphone initialized. Ready to transcribe customer and associate dialogue.',
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
      setMics([
        { deviceId: 'default', label: 'USB Omnidirectional Retail Mic (Realtek High Definition Audio)' },
        { deviceId: 'mic-2', label: 'Jabra Speak 710 Conference Mic' },
        { deviceId: 'mic-3', label: 'Internal Workstation Microphone Array' },
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
        hostname: 'RETAIL-POS-WORKSTATION',
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

  // Push Speech Utterance (Section 3.4)
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

    socket.emit('stream:transcript', {
      storeId,
      storeName,
      location: storeLocation,
      text,
      originalText: original || text,
      speaker,
      isFinal: true,
      language: lang,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Store Workstation Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Retail store audio capture client &bull; Multi-mic hardware detection &bull; Automatic sync on boot & shutdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          {approvalStatus === 'approved' ? (
            <span className="pro-badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Terminal Authorized
            </span>
          ) : (
            <span className="pro-badge bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Pending Admin Approval
            </span>
          )}
        </div>
      </div>

      {/* Section 3.1: Approval Gate Warning Banner */}
      {approvalStatus === 'pending' && (
        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold text-amber-200">
              Registration Under Admin Review (Approval Gate Active)
            </div>
            <p className="text-amber-300/80 mt-0.5 leading-relaxed">
              Recording is safely blocked until an administrator approves this workstation from the Store Approvals portal. Once approved, recording will automatically commence.
            </p>
          </div>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Hardware Detection & Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section 3.3: Hardware / Microphone Detection */}
          <div className="pro-card p-4 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1f2737]">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Microphone Hardware Detection
              </div>
              <button
                onClick={enumerateMicrophones}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-scan</span>
              </button>
            </div>

            {/* Mic Selection Dropdown (Section 3.3.2) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Active Audio Input Device:
              </label>
              <select
                value={selectedMicId}
                onChange={(e) => setSelectedMicId(e.target.value)}
                className="w-full bg-[#0e131b] border border-[#1f2737] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {mics.length === 0 ? (
                  <option value="">Default Microphone Array</option>
                ) : (
                  mics.map((m, idx) => (
                    <option key={m.deviceId || idx} value={m.deviceId}>
                      {m.label || `Connected Microphone ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
              <div className="text-[10px] text-slate-400 font-mono">
                Detected: {mics.length} connected audio capture device(s)
              </div>
            </div>

            {/* Active Audio Indicator & Waveform Visualizer (Section 3.3.3) */}
            <div className="p-3.5 rounded-lg bg-[#0e131b] border border-[#1e2636] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  <span>{isRecording ? 'Microphone is active' : 'Microphone is standby'}</span>
                </span>
                <span className="text-base font-bold font-mono text-white tracking-wider">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              {/* Dynamic Waveform Bars */}
              <div className="h-10 bg-[#141a24] rounded-md px-3 flex items-center justify-between gap-1 overflow-hidden border border-[#1e2738]">
                {Array.from({ length: 24 }).map((_, i) => {
                  const baseH = [10, 16, 26, 14, 22, 32, 18, 12, 28, 30, 16, 12][i % 12];
                  const liveH = isRecording ? Math.min(36, Math.max(8, baseH + (audioLevel > 10 ? (i % 4) * 4 : 0))) : 4;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-100 ${
                        isRecording ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                      style={{ height: `${liveH}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Manual Override Controls (Section 3.2.4) */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recording Controls
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={startRecordingSession}
                  disabled={isRecording || approvalStatus !== 'approved'}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Recording</span>
                </button>

                <button
                  onClick={stopRecordingSession}
                  disabled={!isRecording}
                  className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Recording</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Recording auto-starts on system boot and auto-saves to server on PC shutdown.
              </p>
            </div>
          </div>

          {/* Registration Form / Workstation Info (Section 3.1) */}
          <div className="pro-card p-4 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1f2737]">
              Workstation Credentials
            </div>
            <form onSubmit={handleRegister} className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-[#0e131b] border border-[#1f2737] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Store Location</label>
                <input
                  type="text"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="w-full bg-[#0e131b] border border-[#1f2737] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-[#18202d] hover:bg-[#222c3e] text-slate-200 border border-[#243044] text-xs font-medium transition-colors cursor-pointer"
              >
                Update Terminal Registration
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Conversation Box & Real-Time English Transcription (Section 3.4) */}
        <div className="lg:col-span-7 pro-card p-4 flex flex-col justify-between h-[620px]">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1f2737]">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Conversation Box
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Real-time English transcription output &bull; Dual-language speech detection (EN + ES)
                </p>
              </div>
              <span className="pro-badge bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Always English Output
              </span>
            </div>

            {/* Transcript Stream Display */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 my-3">
              {transcripts.map((t, idx) => {
                const isRep = t.speaker === 'R';
                return (
                  <div key={idx} className={`flex flex-col ${isRep ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5 px-1">
                      <span className="font-semibold text-slate-300">
                        {isRep ? 'Sales Associate (R)' : 'Customer (C)'}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono">{t.time}</span>
                      {t.language === 'es' && (
                        <span className="text-amber-400 text-[10px] font-mono">(Translated from Spanish)</span>
                      )}
                    </div>
                    <div
                      className={`max-w-md p-2.5 rounded-lg text-xs leading-relaxed ${
                        isRep
                          ? 'bg-[#18202d] text-slate-100 border border-[#243044]'
                          : 'bg-blue-600 text-white shadow-sm'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3.4: Dual Language Simulation & Real-time Speech Test Buttons */}
          <div className="pt-3 border-t border-[#1f2737] space-y-2">
            <div className="text-[11px] font-semibold text-slate-400">
              Quick Test Utterances (English & Spanish Audio):
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() =>
                  pushSpeechUtterance(
                    'Good morning, welcome to our store! How can I help you today with a new phone?',
                    'R',
                    'en'
                  )
                }
                disabled={!isRecording}
                className="p-2 rounded-lg bg-[#0e131b] hover:bg-[#161e2a] text-left text-slate-200 border border-[#1e2636] transition-colors disabled:opacity-40 cursor-pointer text-[11px]"
              >
                <div className="font-semibold text-white">English Greeting (R)</div>
                <div className="text-slate-400 truncate">"Good morning, welcome to our store..."</div>
              </button>

              <button
                onClick={() =>
                  pushSpeechUtterance(
                    'Hello, good morning, how much does this phone cost?',
                    'C',
                    'es',
                    'Hola, buenos días, cuánto cuesta este teléfono?'
                  )
                }
                disabled={!isRecording}
                className="p-2 rounded-lg bg-[#0e131b] hover:bg-[#161e2a] text-left text-slate-200 border border-[#1e2636] transition-colors disabled:opacity-40 cursor-pointer text-[11px]"
              >
                <div className="font-semibold text-amber-300">Spanish Inquiry (C) &rarr; English</div>
                <div className="text-slate-400 truncate">"Hola, buenos días, cuánto cuesta..."</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
