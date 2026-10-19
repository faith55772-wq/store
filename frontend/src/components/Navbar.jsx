import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, Shield, CheckCircle2, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ selectedStore, onSelectStore, onRefresh }) {
  const [stores, setStores] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    api.getStores()
      .then((res) => setStores(res.stores || []))
      .catch(() => {});

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-[#0f141d] border-b border-[#1f2737] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Location Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#141a24] border border-[#202938] rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Store Location:</span>
          <select
            value={selectedStore}
            onChange={(e) => onSelectStore(e.target.value)}
            className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-[#141a24] text-slate-200">
              All Store Locations
            </option>
            {stores.map((s) => (
              <option key={s.storeId} value={s.storeId} className="bg-[#141a24] text-slate-200">
                {s.name} — {s.location}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Audio Ingestion Active</span>
        </div>
      </div>

      {/* Right: Actions and Live Clock */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-md bg-[#141a24] border border-[#202938]">
          {currentTime}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-[#141a24] hover:bg-[#1a2230] text-slate-400 hover:text-slate-200 transition-colors border border-[#202938]"
            title="Refresh Store Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141a24] border border-[#202938] text-slate-300 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Authenticated Admin</span>
        </div>
      </div>
    </header>
  );
}
