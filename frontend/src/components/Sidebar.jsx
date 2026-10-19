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
  CheckCircle2,
  Server,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending store registrations
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

    socket.on('store:new_registration', handleNewReg);
    socket.on('store:status_updated', handleStatusUpdate);

    return () => {
      socket.off('store:new_registration', handleNewReg);
      socket.off('store:status_updated', handleStatusUpdate);
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
      badge: pendingCount > 0 ? `${pendingCount} Pending` : null,
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    {
      to: '/live',
      label: 'Live Monitor',
      icon: Radio,
      badge: 'Active',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    {
      to: '/recordings',
      label: 'Conversation Library',
      icon: Library,
      badge: null,
    },
    {
      to: '/reports',
      label: 'Daily Reports',
      icon: FileText,
      badge: 'Audit & PDF',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    {
      to: '/terminal',
      label: 'Store Terminal Client',
      icon: Mic,
      badge: 'Workstation',
      badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
    },
  ];

  return (
    <aside className="w-64 bg-[#0f141d] border-r border-[#1f2737] flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1f2737] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white">
              STORE LISTENER
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              Retail Intelligence Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/25 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#151c28]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Services Health */}
      <div className="p-3 border-t border-[#1f2737] bg-[#0c1017]">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-2 mb-2">
          System Infrastructure
        </div>
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#131923] border border-[#1e2636]">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-300">Database Cluster</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Online
            </span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#131923] border border-[#1e2636]">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-300">Speech Engine</span>
            </div>
            <span className="text-[10px] text-blue-400 font-medium">Nova-2 Dual</span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#131923] border border-[#1e2636]">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-300">Stream Gateway</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Ready</span>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1f2737] flex items-center justify-between bg-[#0b0f17]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1f2738] border border-[#2b364d] flex items-center justify-center font-semibold text-xs text-slate-200">
            AD
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Store Operations</div>
            <div className="text-[10px] text-slate-400">administrator@retail.internal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
