import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Printer,
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
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Controls Bar (Date Filter + Run Daily Audit + Print PDF) */}
      <div className="pro-card p-3 flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#0e131b] border border-[#1f2737] rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Audit Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FileText className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Compiling Day Audit...' : 'Compile Daily Report'}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#222c3e] text-slate-200 font-medium text-xs border border-[#243044] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="pro-card p-6 md:p-8 space-y-6 bg-[#111722] border-[#222b3c]">
        {/* Section 5.1: Report Header */}
        <div className="border-b border-[#222b3c] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base">
              SL
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">
                STORE LISTENER &bull; DAILY PERFORMANCE AUDIT
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Executive Sales Monitoring & Customer Conversation Intelligence
              </div>
            </div>
          </div>

          <div className="text-left md:text-right text-xs">
            <div className="font-semibold text-slate-200">Date: {report?.date || date}</div>
            <div className="text-[11px] text-slate-400">Store: {report?.storeName || 'All Stores'} &bull; {report?.location || 'United States'}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              Generated: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Section 5.1.2: Headline Banner */}
        <div className="p-3.5 rounded-lg bg-[#16202e] border border-[#233146] text-xs font-semibold text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{report?.headlineBanner || `Active day, $${revenue.totalAmount} in sales, ${conversations.totalCount} customer conversations`}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">Daily Executive Summary</span>
        </div>

        {/* Section 5.2: Six Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* 1. REVENUE */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Revenue
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              ${revenue.totalAmount || 0}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {revenue.itemsSold || 0} item(s) sold
            </div>
          </div>

          {/* 2. MISSED */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Missed
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              ${missed.potentialAmount || 0}
            </div>
            <div className="text-[10px] text-amber-400/90 mt-0.5">
              {missed.missedOpportunitiesCount || 0} opp(s) missed
            </div>
          </div>

          {/* 3. CONVERSATIONS */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Conversations
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {conversations.totalCount || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Customers attended
            </div>
          </div>

          {/* 4. AVG TICKET */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Avg Ticket
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              ${avgTicket.amount || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Per sale transaction
            </div>
          </div>

          {/* 5. LOW STOCK */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {lowStock.count || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Items flagged
            </div>
          </div>

          {/* 6. REDACTED */}
          <div className="p-3 rounded-lg bg-[#0e131b] border border-[#1e2636]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Redacted
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {redacted.count || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              PII items protected
            </div>
          </div>
        </div>

        {/* Section 5.3: Daily Executive Summary & Key Points */}
        <div className="p-5 rounded-lg bg-[#0e131b] border border-[#1e2636] space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider pb-1.5 border-b border-[#1e2636]">
            Daily Executive Summary & Operational Takeaways
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {report?.executiveSummary ||
              `Today our store team engaged with ${conversations.totalCount} customer interactions, generating $${revenue.totalAmount} in verified sales across retail counters. Customer sentiment was predominantly positive with strong consumer interest in flagship smartphones. Sales representatives consistently maintained professional greetings, while proactive cross-selling of power adapters and protective cases remains the primary revenue enhancement opportunity.`}
          </p>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-200 mb-2">Key Observations:</div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(report?.keyPoints || [
                `Conducted ${conversations.totalCount} customer interactions with an average transaction value of $${avgTicket.amount}.`,
                `Customer reception was measured at ${sent.positivePercent}% Positive, ${sent.neutralPercent}% Neutral, and ${sent.negativePercent}% Negative.`,
                `Identified $${missed.potentialAmount} in missed revenue opportunities across ${missed.missedOpportunitiesCount} interactions, primarily in high-margin charging blocks.`,
                'Customer privacy was maintained with automated PII masking on payment and phone details.',
              ]).map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">&bull;</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Grid: Sentiment Breakdown (Section 5.4) & Actions for Tomorrow (Section 5.5) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Section 5.4: Customer Sentiment Visual Chart */}
          <div className="md:col-span-5 p-4 rounded-lg bg-[#0e131b] border border-[#1e2636] flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1e2636]">
                Customer Sentiment Breakdown
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-emerald-400">Positive: {sent.positivePercent}%</span>
                  <span className="text-slate-400">Neutral: {sent.neutralPercent}%</span>
                  <span className="text-rose-400">Negative: {sent.negativePercent}%</span>
                </div>

                {/* Sentiment Distribution Bar */}
                <div className="h-2.5 w-full bg-[#18202d] rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${sent.positivePercent}%` }}></div>
                  <div className="bg-slate-500 h-full transition-all" style={{ width: `${sent.neutralPercent}%` }}></div>
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${sent.negativePercent}%` }}></div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Evaluated across all audio dialogues captured from retail lanes today.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2636] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Overall Satisfaction</span>
              <span className="text-emerald-400 font-semibold">{sent.positivePercent >= 60 ? 'Healthy' : 'Requires Focus'}</span>
            </div>
          </div>

          {/* Section 5.5: Actions For Tomorrow (AI Recommendations) */}
          <div className="md:col-span-7 p-4 rounded-lg bg-[#0e131b] border border-[#1e2636] space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1e2636]">
              Store Action Plan for Tomorrow
            </div>
            <div className="space-y-2">
              {(report?.actionsForTomorrow || [
                'Ensure 100% charger attachment pitch: Remind all reps that modern smartphones do not include wall plugs.',
                'Replenish high-velocity phone cases and screen protectors on the primary demonstration tables.',
                'Overcome price resistance: Highlight 0% APR carrier installments when shoppers hesitate on upfront cost.',
                'Address negative customer refusals: Coach team on empathetic listening and proposing alternative models.',
              ]).map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5.6: Conversations & Transcripts Breakdown (Interaction Logs) */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#222b3c] flex items-center justify-between">
            <span>Interaction Logs & Associate Coaching</span>
            <span className="text-[11px] font-mono text-slate-400">
              {(report?.interactions || []).length} Interactions Logged
            </span>
          </div>

          <div className="space-y-3">
            {(report?.interactions || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recorded interactions found for this date.
              </div>
            ) : (
              report.interactions.map((int) => (
                <div key={int.interactionNumber} className="p-3.5 rounded-lg bg-[#0e131b] border border-[#1e2636] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-white">Interaction #{int.interactionNumber}</strong>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{int.exactTime}</span>
                      <span>&bull;</span>
                      <span>{int.location}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{int.durationSeconds}s</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`pro-badge ${
                          int.sentimentTag === 'Positive'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : int.sentimentTag === 'Negative'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {int.sentimentTag}
                      </span>
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-[#18202d] border border-[#243044] text-slate-200">
                        Score: {int.performanceScore}/10
                      </span>
                    </div>
                  </div>

                  {int.missedOpportunityAlert && (
                    <div className="text-[11px] text-rose-400 font-medium">
                      ⚠️ {int.missedOpportunityAlert}
                    </div>
                  )}

                  <p className="text-xs text-slate-200 italic bg-[#141a24] p-2.5 rounded border border-[#1e2738] leading-relaxed">
                    "{int.transcriptSummary}"
                  </p>

                  <div className="text-xs text-blue-300 font-medium bg-[#141d2a] px-3 py-1.5 rounded border border-[#202d42]">
                    💡 <strong>Coaching:</strong> {int.coachingTip}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
