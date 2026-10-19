import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Library,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';

export default function RecordingsLibrary() {
  const { selectedStore, refreshTrigger } = useOutletContext();
  const navigate = useNavigate();

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analyzedFilter, setAnalyzedFilter] = useState('');

  const loadRecordings = () => {
    setLoading(true);
    api.getRecordings({
      storeId: selectedStore,
      status: statusFilter,
      analyzed: analyzedFilter,
      search,
    })
      .then((res) => {
        setRecordings(res.recordings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch recordings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRecordings();
  }, [selectedStore, statusFilter, analyzedFilter, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRecordings();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Recordings Library
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Section 4.4
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical audio recordings, speaker separated logs, and single-audio AI conversation intelligence.
          </p>
        </div>

        <button
          onClick={loadRecordings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript text, customer ID, or representative..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="live">Live</option>
          </select>

          <select
            value={analyzedFilter}
            onChange={(e) => setAnalyzedFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="">AI Status: All</option>
            <option value="true">Analyzed</option>
            <option value="false">Pending AI</option>
          </select>
        </div>
      </div>

      {/* Recordings Table (Section 4.4.1) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 pl-4">Recording ID</th>
                <th className="py-3.5">Store & Location</th>
                <th className="py-3.5">Date & Time</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5">Transcript Snippet</th>
                <th className="py-3.5">AI Insights</th>
                <th className="py-3.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recordings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No conversation recordings matching the selected filters.
                  </td>
                </tr>
              ) : (
                recordings.map((rec) => {
                  const ai = rec.aiAnalysis || {};
                  const isAnalyzed = ai.analyzed;
                  const hasMissed = ai.missedOpportunity?.detected;

                  return (
                    <tr
                      key={rec.recordingId}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/recordings/${rec.recordingId}`)}
                    >
                      <td className="py-4 pl-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {rec.recordingId}
                      </td>

                      <td className="py-4">
                        <div className="font-semibold text-slate-200">{rec.storeName}</div>
                        <div className="text-[11px] text-slate-400">{rec.location}</div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <div className="text-slate-300 font-medium">
                          {new Date(rec.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' '}&bull; {rec.durationSeconds || 30}s
                        </div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        {rec.status === 'live' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      <td className="py-4 max-w-xs">
                        <p className="text-slate-300 line-clamp-2 leading-relaxed text-[11px] italic">
                          "{rec.fullTranscript || 'Audio captured, ready for transcription.'}"
                        </p>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        {isAnalyzed ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ai.customerSentiment === 'Positive'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : ai.customerSentiment === 'Negative'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700/60 text-slate-300'
                                }`}
                              >
                                {ai.customerSentiment} ({ai.sentimentScore}%)
                              </span>
                            </div>
                            {hasMissed && (
                              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Missed: {ai.missedOpportunity.category}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pending AI
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recordings/${rec.recordingId}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-xs border border-sky-500/30 transition-all group-hover:scale-105"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Detail Analysis</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
