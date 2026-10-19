import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Mic,
  Monitor,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function StoreApprovals() {
  const [pendingStores, setPendingStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getPendingStores(), api.getStores()])
      .then(([pendingRes, allRes]) => {
        setPendingStores(pendingRes.stores || []);
        setAllStores(allRes.stores || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load stores:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    const handleNewRegistration = (store) => {
      setPendingStores((prev) => [store, ...prev.filter((s) => s.storeId !== store.storeId)]);
      setActionMessage({ type: 'info', text: `New registration received from: ${store.name}` });
    };

    const handleStatusUpdate = () => {
      loadData();
    };

    socket.on('store:new_registration', handleNewRegistration);
    socket.on('store:status_updated', handleStatusUpdate);

    return () => {
      socket.off('store:new_registration', handleNewRegistration);
      socket.off('store:status_updated', handleStatusUpdate);
    };
  }, []);

  const handleApprove = async (storeId) => {
    try {
      const res = await api.approveStore(storeId);
      setActionMessage({
        type: 'success',
        text: `Store approved successfully. Remote client auto-start signal dispatched.`,
      });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: `Approval failed: ${err.message}` });
    }
  };

  const handleReject = async (storeId) => {
    try {
      const res = await api.rejectStore(storeId);
      setActionMessage({ type: 'error', text: res.message || 'Store registration declined.' });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: `Action failed: ${err.message}` });
    }
  };

  const filteredApprovedStores = allStores
    .filter((s) => s.status !== 'pending')
    .filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header (Section 4.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Store Terminal Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and authorize newly installed Windows Client (.exe) registrations before recording begins.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a24] hover:bg-[#1a2230] text-slate-300 text-xs font-medium border border-[#202938] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : actionMessage.type === 'error'
              ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
              : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Pending Approval Requests Queue (Section 3.1 & 4.1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Pending Store Requests</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              {pendingStores.length} Pending
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Approval gate active: recording is blocked until confirmed</span>
        </div>

        {pendingStores.length === 0 ? (
          <div className="pro-card p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-medium text-slate-200">All Store Registrations Processed</div>
            <p className="text-xs text-slate-400 mt-1">
              No retail client terminals are currently awaiting administrator authorization.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStores.map((store) => (
              <div key={store.storeId} className="pro-card p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-white">{store.name}</div>
                      <div className="text-xs text-slate-400">{store.location}</div>
                    </div>
                    <span className="pro-badge bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pending
                    </span>
                  </div>

                  {/* System & Hardware Details */}
                  <div className="p-2.5 rounded-lg bg-[#0e131b] border border-[#1b2332] text-[11px] space-y-1 font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Store Code:</span>
                      <span className="font-semibold text-white">{store.storeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Mic:</span>
                      <span className="text-blue-300 truncate max-w-[200px]">{store.systemInfo?.activeMic || 'Microphone detected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Workstation OS:</span>
                      <span className="text-slate-300">{store.systemInfo?.os || 'Windows 11 Pro'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Approve (Auto-starts recording) vs Decline */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#1f2737]">
                  <button
                    onClick={() => handleApprove(store.storeId)}
                    className="flex-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize Store</span>
                  </button>
                  <button
                    onClick={() => handleReject(store.storeId)}
                    className="py-1.5 px-3 rounded-md bg-[#18202c] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#242f42] hover:border-rose-800/40 text-xs font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorized Stores Roster */}
      <div className="space-y-3 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Registered Retail Network</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141a24] border border-[#202938] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-60"
            />
          </div>
        </div>

        <div className="pro-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e131b] border-b border-[#1f2737] text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Store Identifier</th>
                  <th className="py-2.5 px-4">Store Name & Location</th>
                  <th className="py-2.5 px-4">Hardware Mic</th>
                  <th className="py-2.5 px-4">Authorization</th>
                  <th className="py-2.5 px-4">Recording State</th>
                  <th className="py-2.5 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2737] text-slate-300">
                {filteredApprovedStores.map((s) => (
                  <tr key={s.storeId} className="hover:bg-[#151c27] transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-200">
                      {s.storeId}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.location}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 text-[11px] font-mono">
                      {s.systemInfo?.activeMic || 'Microphone'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`pro-badge ${
                          s.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {s.status === 'approved' ? 'Authorized' : 'Declined'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          s.isRecording ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isRecording ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                        {s.isRecording ? 'Capturing Audio' : 'Standby'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(s.lastSeenAt || s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
