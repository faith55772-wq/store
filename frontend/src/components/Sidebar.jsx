import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Radio,
  Library,
  FileText,
  Mic,
  Database,
  Cpu,
  Store,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [activeLiveCount, setActiveLiveCount] = useState(1);

  useEffect(() => {
    // Fetch initial pending stores count
    api.getPendingStores()
      .then((res) => setPendingCount(res.count || 0))
      .catch(() => {});

    const socket = getSocket();

    const handleNewReg = () => {
      setPendingCount((prev) => prev + 1);
    };

    const handleStatusUpdate = () => {
      api.getPendingStores()
        .then((res) => setPendingCount(res.count || 0))
        .catch(() => {});
    };

    const handleStreamChange = (data) => {
      if (data.status === 'LIVE') {
        setActiveLiveCount((prev) => Math.max(1, prev));
      }
    };

    socket.on('store:new_registration', handleNewReg);
    socket.on('store:status_updated', handleStatusUpdate);
    socket.on('stream:status_change', handleStreamChange);

    return () => {
      socket.off('store:new_registration', handleNewReg);
      socket.off('store:status_updated', handleStatusUpdate);
      socket.off('stream:status_change', handleStreamChange);
    };
  }, []);

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/approvals',
      label: 'Store Approvals',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? `${pendingCount} PENDING` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      to: '/live',
      label: 'Live Monitor',
      icon: Radio,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse',
    },
    {
      to: '/recordings',
      label: 'Recordings Library',
      icon: Library,
      badge: null,
    },
    {
      to: '/reports',
      label: 'Daily Reports (PDF)',
      icon: FileText,
      badge: 'Section 5',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      to: '/terminal',
      label: 'Store Client (.exe)',
      icon: Mic,
      badge: 'Hardware Mic',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              STORE LISTENER
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              AI Sales Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Cloud & Hardware Status Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
          Connected Infrastructure
        </div>
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MongoDB Atlas</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Deepgram Nova-2</span>
            </div>
            <span className="text-[10px] text-sky-400 font-mono font-semibold">Active</span>
          </div>

          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Socket.IO Live</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Connected</span>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            CA
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Chief Admin</div>
            <div className="text-[10px] text-slate-400 font-mono">admin@storelistener.ai</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
