import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Library,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
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
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header (Section 4.4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Conversation Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical audio recordings, speaker-separated logs, and sales interaction assessments.
          </p>
        </div>

        <button
          onClick={loadRecordings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a24] hover:bg-[#1a2230] text-slate-300 text-xs font-medium border border-[#202938] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="pro-card p-3 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript, customer ID, or representative name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0e131b] border border-[#1f2737] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0e131b] border border-[#1f2737] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="live">Live</option>
          </select>

          <select
            value={analyzedFilter}
            onChange={(e) => setAnalyzedFilter(e.target.value)}
            className="bg-[#0e131b] border border-[#1f2737] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Analysis: All</option>
            <option value="true">Analyzed</option>
            <option value="false">Pending</option>
          </select>
        </div>
      </div>

      {/* Recordings Table (Section 4.4.1) */}
      <div className="pro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e131b] border-b border-[#1f2737] text-slate-400 font-medium">
              <tr>
                <th className="py-2.5 pl-4">Recording ID</th>
                <th className="py-2.5 px-3">Store Location</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Transcript Snippet</th>
                <th className="py-2.5 px-3">Evaluation</th>
                <th className="py-2.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2737] text-slate-300">
              {recordings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
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
                      className="hover:bg-[#151c27] transition-colors cursor-pointer"
                      onClick={() => navigate(`/recordings/${rec.recordingId}`)}
                    >
                      <td className="py-3 pl-4 font-mono font-medium text-blue-400 whitespace-nowrap">
                        {rec.recordingId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{rec.storeName}</div>
                        <div className="text-[11px] text-slate-400">{rec.location}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-200">
                          {new Date(rec.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {rec.durationSeconds || 30}s
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {rec.status === 'live' ? (
                          <span className="pro-badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                            LIVE
                          </span>
                        ) : (
                          <span className="pro-badge bg-slate-800 text-slate-300 border border-slate-700">
                            Completed
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-300 line-clamp-2 text-[11px]">
                          "{rec.fullTranscript || 'Audio captured, ready for transcription.'}"
                        </p>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isAnalyzed ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`pro-badge ${
                                  ai.customerSentiment === 'Positive'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : ai.customerSentiment === 'Negative'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {ai.customerSentiment} ({ai.sentimentScore}%)
                              </span>
                            </div>
                            {hasMissed && (
                              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Missed: {ai.missedOpportunity.category}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="pro-badge bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recordings/${rec.recordingId}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18202d] hover:bg-[#202b3d] text-blue-300 font-medium text-xs border border-[#243044] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Review</span>
                          <ChevronRight className="w-3 h-3" />
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
