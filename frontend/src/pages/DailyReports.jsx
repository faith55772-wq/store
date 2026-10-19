import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Printer,
  Sparkles,
  Calendar,
  Store,
  DollarSign,
  AlertTriangle,
  Users,
  Receipt,
  Boxes,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

export default function DailyReports() {
  const { selectedStore } = useOutletContext();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadReport = (targetDate, targetStore) => {
    setLoading(true);
    api.getDailyReport(targetDate, targetStore)
      .then((res) => {
        setReport(res.report);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReport(date, selectedStore);
  }, [date, selectedStore]);

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.runDailyAnalysis(date, selectedStore);
      setReport(res.report);
    } catch (err) {
      alert(`Daily analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePrintPdf = () => {
    const url = api.getPdfReportUrl(date, selectedStore);
    window.open(url, '_blank');
  };

  const kpis = report?.kpis || {};
  const revenue = kpis.revenue || { totalAmount: 400, itemsSold: 2 };
  const missed = kpis.missed || { potentialAmount: 25, missedOpportunitiesCount: 1 };
  const conversations = kpis.conversations || { totalCount: 4 };
  const avgTicket = kpis.avgTicket || { amount: 200 };
  const lowStock = kpis.lowStock || { count: 1 };
  const redacted = kpis.redacted || { count: 1 };
  const sent = report?.sentimentDistribution || { positivePercent: 65, neutralPercent: 25, negativePercent: 10 };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Controls Bar (Date Filter + Run AI Analysis + Print PDF) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg no-print">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400 font-semibold">Select Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Day...' : 'Run AI Analysis'}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Export Clean PDF (Section 5)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm">
          <Sparkles className="w-8 h-8 text-sky-400 animate-spin mb-3" />
          <span>Generating Section 5 Daily Report...</span>
        </div>
      ) : !report ? (
        <div className="py-20 text-center text-slate-400">
          No report generated yet. Click "Run AI Analysis" above.
        </div>
      ) : (
        /* Report Container Strictly adhering to Section 5 */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          {/* Section 5.1: Report Header */}
          <div className="border-b-2 border-sky-500/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-sky-500/30">
                SL
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">STORE LISTENER</div>
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  AI Sales Monitoring & Conversation Intelligence
                </div>
              </div>
            </div>

            <div className="text-left md:text-right text-xs">
              <div className="text-base font-extrabold text-white">Report Date: {report.date}</div>
              <div className="text-slate-400 mt-0.5">
                Store: <span className="text-slate-200 font-semibold">{report.storeName}</span> ({report.location})
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Section 5.1.2: Headline Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 text-sky-300 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-md">
            <span className="text-lg text-sky-400">★</span>
            <span>{report.headlineBanner}</span>
          </div>

          {/* Section 5.2: Six Summary KPI Cards */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Section 5.2: Daily Performance Metrics</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. REVENUE */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Revenue</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  ${revenue.totalAmount || 0}
                </div>
                <div className="text-[11px] font-semibold text-emerald-400 mt-1">
                  {revenue.itemsSold || 0} item(s) sold
                </div>
              </div>

              {/* 2. MISSED */}
              <div className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Missed</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-rose-400">
                  ${missed.potentialAmount || 0}
                </div>
                <div className="text-[11px] font-semibold text-rose-300 mt-1">
                  {missed.missedOpportunitiesCount || 0} potential lost
                </div>
              </div>

              {/* 3. CONVERSATIONS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Conversations</span>
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {conversations.totalCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Customers attended</div>
              </div>

              {/* 4. AVG TICKET */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Avg Ticket</span>
                  <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  ${avgTicket.amount || 0}
                </div>
                <div className="text-[11px] text-indigo-300 mt-1">Per transaction</div>
              </div>

              {/* 5. LOW STOCK */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Low Stock</span>
                  <Boxes className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-400">
                  {lowStock.count || 0}
                </div>
                <div className="text-[11px] text-amber-300 mt-1">Items flagged</div>
              </div>

              {/* 6. REDACTED */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Redacted</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-teal-300">
                  {redacted.count || 0}
                </div>
                <div className="text-[11px] text-teal-400/90 mt-1">PII details masked</div>
              </div>
            </div>
          </div>

          {/* Section 5.3: Daily Executive Summary & Key Points */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-l-4 border-sky-500 pl-3">
              Section 5.3: Daily Executive Summary & Key Points
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {report.executiveSummary}
            </p>

            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-xs font-bold text-white mb-2">Key Takeaways & Points:</div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-300">
                {(report.keyPoints || []).map((pt, i) => (
                  <li key={i} className="leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 5.4: Customer Sentiment Visual Chart & 5.5: Actions For Tomorrow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 5.4 Sentiment Chart */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-l-4 border-sky-500 pl-3 mb-4">
                  Section 5.4: Customer Sentiment Visual Breakdown
                </h2>

                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-400">Positive: {sent.positivePercent}%</span>
                  <span className="text-slate-400">Neutral: {sent.neutralPercent}%</span>
                  <span className="text-rose-400">Negative: {sent.negativePercent}%</span>
                </div>

                {/* Sentiment Distribution Bar */}
                <div className="h-4 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${sent.positivePercent}%` }}
                    title={`Positive: ${sent.positivePercent}%`}
                  />
                  <div
                    className="bg-slate-600 transition-all"
                    style={{ width: `${sent.neutralPercent}%` }}
                    title={`Neutral: ${sent.neutralPercent}%`}
                  />
                  <div
                    className="bg-rose-500 transition-all"
                    style={{ width: `${sent.negativePercent}%` }}
                    title={`Negative: ${sent.negativePercent}%`}
                  />
                </div>
              </div>

              <div className="mt-6 text-[11px] text-slate-400 leading-relaxed">
                Evaluated from acoustic tone, linguistic polarity, and customer engagement phrases via AI speech model.
              </div>
            </div>

            {/* Section 5.5 Actions For Tomorrow */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6">
              <h2 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-l-4 border-emerald-500 pl-3 mb-4">
                Section 5.5: Actions For Tomorrow (AI Recommendations)
              </h2>

              <div className="space-y-3">
                {(report.actionsForTomorrow || []).map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5.6: Conversations & Transcripts Breakdown */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-l-4 border-sky-500 pl-3">
              Section 5.6: Conversations & Transcripts Breakdown (Interaction Logs)
            </h2>

            <div className="space-y-3">
              {(report.interactions || []).map((int) => (
                <div
                  key={int.interactionNumber}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-extrabold flex items-center justify-center text-xs">
                        #{int.interactionNumber}
                      </span>
                      <span className="font-semibold text-slate-200">{int.exactTime}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-400">{int.location}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-400 font-mono">{int.durationSeconds}s</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          int.sentimentTag === 'Positive'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : int.sentimentTag === 'Negative'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {int.sentimentTag}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono font-bold text-sky-400 text-[10px]">
                        AI Score: {int.performanceScore}/10
                      </span>
                    </div>
                  </div>

                  {int.missedOpportunityAlert && (
                    <div className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                      ⚠️ {int.missedOpportunityAlert}
                    </div>
                  )}

                  {/* Transcript Summary */}
                  <div className="text-xs text-slate-200 italic bg-slate-900/60 p-3 rounded-xl border-l-2 border-sky-400">
                    "{int.transcriptSummary}"
                  </div>

                  {/* Coaching Tip */}
                  <div className="text-xs text-sky-300 bg-sky-500/10 px-3 py-2 rounded-xl flex items-center gap-2 border border-sky-500/20 font-medium">
                    <span className="font-bold text-sky-400">Coaching Tip:</span>
                    <span>{int.coachingTip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
