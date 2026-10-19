import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, Bell, Shield, Activity } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ selectedStore, onSelectStore, onRefresh }) {
  const [stores, setStores] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    api.getStores()
      .then((res) => setStores(res.stores || []))
      .catch(() => {});

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Left: Location Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Store className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 font-medium">Filter Location:</span>
          <select
            value={selectedStore}
            onChange={(e) => onSelectStore(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">
              All United States Stores
            </option>
            {stores.map((s) => (
              <option key={s.storeId} value={s.storeId} className="bg-slate-900 text-slate-200">
                {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Stream: Active</span>
        </div>
      </div>

      {/* Right: Actions and Live Clock */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
          {currentTime}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors border border-slate-700/80"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Enterprise Guard</span>
        </div>
      </div>
    </header>
  );
}
