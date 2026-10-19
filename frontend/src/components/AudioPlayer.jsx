import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward } from 'lucide-react';

export default function AudioPlayer({ audioUrl, duration = 60 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // If no audio file on disk, simulate realistic playback timeline
  const intervalRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {
          // Play synthetic simulated audio timeline
          simulatePlayback();
        });
        setIsPlaying(true);
      }
    } else {
      // Synthetic simulation
      if (isPlaying) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      } else {
        simulatePlayback();
      }
    }
  };

  const simulatePlayback = () => {
    setIsPlaying(true);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          clearInterval(intervalRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000 / playbackRate);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const cycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const next = rates[nextIdx];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Audio Waveform Animation Visualizer */}
      <div className="h-12 bg-slate-950/80 rounded-xl px-4 flex items-center justify-between gap-1 overflow-hidden border border-slate-800/60">
        {Array.from({ length: 48 }).map((_, i) => {
          const progress = currentTime / (duration || 60);
          const barPos = i / 48;
          const isPassed = barPos <= progress;
          // Varied height pattern resembling human voice
          const heights = [16, 24, 38, 20, 32, 42, 28, 14, 30, 46, 22, 18, 36, 40, 26, 14];
          const baseHeight = heights[i % heights.length];
          const dynamicHeight = isPlaying && isPassed ? Math.min(44, baseHeight + (i % 5) * 2) : baseHeight;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPassed ? 'bg-sky-400 shadow-sm shadow-sky-500/50' : 'bg-slate-700/60'
              }`}
              style={{ height: `${dynamicHeight}px` }}
            />
          );
        })}
      </div>

      {/* Controls & Timeline */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md shadow-sky-500/20 flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            max={duration || 60}
            step="0.5"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 60)}</span>
          </div>
        </div>

        {/* Speed toggle */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300 border border-slate-700 transition-colors"
        >
          {playbackRate}x
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
