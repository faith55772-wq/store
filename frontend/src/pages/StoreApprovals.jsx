import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Mic,
  Monitor,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export default function StoreApprovals() {
  const [pendingStores, setPendingStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

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
        text: `✓ ${res.message || 'Store approved successfully! Auto-start recording trigger dispatched.'}`,
      });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: `Approval failed: ${err.message}` });
    }
  };

  const handleReject = async (storeId) => {
    try {
      const res = await api.rejectStore(storeId);
      setActionMessage({ type: 'error', text: res.message || 'Store request rejected.' });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: `Rejection failed: ${err.message}` });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Store Approvals Module
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Section 4.1
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and authorize newly installed Windows Client (.exe) registrations before recording begins.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : actionMessage.type === 'info'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Pending Store Approvals Queue (Section 4.1.1) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Pending Authorization Requests
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
            {pendingStores.length} Pending
          </span>
        </div>

        {pendingStores.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-semibold text-slate-300">All Store Requests Processed</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No retail desktop clients currently waiting in the gate. To simulate a new request, open the Store Client tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStores.map((store) => (
              <div
                key={store.storeId}
                className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-4 shadow-lg shadow-amber-500/5"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-base text-white">{store.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Store className="w-3.5 h-3.5 text-sky-400" />
                        <span>{store.location}</span>
                        {store.address && <span>&bull; {store.address}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      APPROVAL GATE
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div className="text-[10px] text-slate-500">Host PC</div>
                        <div className="font-semibold text-slate-300 truncate">
                          {store.systemInfo?.hostname || 'STORE-PC'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-sky-400" />
                      <div className="truncate">
                        <div className="text-[10px] text-slate-500">Hardware Mic</div>
                        <div className="font-semibold text-slate-300 truncate">
                          {store.systemInfo?.activeMic || 'Detected Microphone'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Actions (Section 3.1 & 3.2: Auto-start on approval) */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleApprove(store.storeId)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Auto-Start Recording</span>
                  </button>

                  <button
                    onClick={() => handleReject(store.storeId)}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Stores Registry */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-base font-bold text-white tracking-tight mb-4">
          Authorized Store Network
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Store ID</th>
                <th className="pb-3">Name & Location</th>
                <th className="pb-3">Hardware Input</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Recording State</th>
                <th className="pb-3 pr-2">Approved Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allStores.map((s) => (
                <tr key={s.storeId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pl-2 font-mono font-bold text-sky-400">{s.storeId}</td>
                  <td className="py-3.5">
                    <div className="font-semibold text-slate-200">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.location}</div>
                  </td>
                  <td className="py-3.5 text-slate-300 font-mono text-[11px]">
                    {s.systemInfo?.activeMic || 'Default Mic'}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : s.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {s.isRecording ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/60">
                        ENDED / IDLE
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-slate-400">
                    {s.approvedAt ? new Date(s.approvedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
