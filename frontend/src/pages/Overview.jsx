import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Download,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview() {
  const { selectedStore, refreshTrigger } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getOverviewStats(selectedStore)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overview:', err);
        setLoading(false);
      });
  }, [selectedStore, refreshTrigger]);

  const kpis = data?.kpis || {
    totalConversations: 0,
    analyzedConversations: 0,
    missedOpportunities: 0,
    salesOpportunities: 0,
  };

  const chartData = data?.activityChartData || [];
  const maxDayTotal = Math.max(...chartData.map((d) => d.total || 0), 5);

  const categoryBreakdown = data?.categoryBreakdown || [
    { category: 'Charger', percentage: 45, count: 5 },
    { category: 'Phone models', percentage: 30, count: 3 },
    { category: 'Protective Case', percentage: 15, count: 2 },
    { category: 'Warranty', percentage: 10, count: 1 },
  ];

  const insights = data?.highLevelInsights || {
    reviewRequiredCount: 2,
    topMissedProduct: 'Charger',
    topMissedPercentage: 45,
    recommendation: 'Mandate attaching a 30W charging adapter to every new phone checkout to capture immediate high-margin revenue.',
  };

  const handleDownloadPdf = () => {
    // Navigate to Daily Reports page or open print view
    navigate('/reports');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Title and Download PDF Button (Section 4.3.4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            StoreAI Intelligence Dashboard
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Overview
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time conversational telemetry, missed sales opportunity tracking, and speech intelligence.
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* 4 Top KPI Cards (Section 4.3.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Conversations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Conversations
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{kpis.totalConversations}</span>
            <span className="text-xs text-slate-400">interactions</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% microphone capture</span>
          </div>
        </div>

        {/* Card 2: Analyzed Conversations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Analyzed Conversations
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{kpis.analyzedConversations}</span>
            <span className="text-xs text-indigo-400 font-semibold">
              {kpis.totalConversations > 0
                ? `${Math.round((kpis.analyzedConversations / kpis.totalConversations) * 100)}% analyzed`
                : '0%'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Deepgram Nova-2 + AI Engine</span>
          </div>
        </div>

        {/* Card 3: Missed Opportunities */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Missed Opportunities
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">{kpis.missedOpportunities}</span>
            <span className="text-xs text-rose-300 font-semibold">sales lost</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-rose-400/90 font-medium">
            <span>High priority coaching required</span>
          </div>
        </div>

        {/* Card 4: Sales Opportunities */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sales Opportunities
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{kpis.salesOpportunities}</span>
            <span className="text-xs text-emerald-300 font-semibold">closed & pitched</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <span>Revenue growth potential</span>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Graph & AI Insights (Section 4.3.2 & 4.3.3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph: 7 Days Conversation Activity (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                7-Day Conversation Activity
              </h2>
              <p className="text-xs text-slate-400">
                Daily volume of customer audio analyzed across retail stores
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                Total
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                Analyzed
              </span>
            </div>
          </div>

          {/* Bar / Column Visualizer */}
          <div className="h-56 flex items-end justify-between gap-4 pt-8 px-2 border-b border-slate-800">
            {chartData.map((d, idx) => {
              const heightTotal = Math.max(14, (d.total / maxDayTotal) * 160);
              const heightAnalyzed = Math.max(8, (d.analyzed / maxDayTotal) * 160);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.total} conv
                  </div>
                  <div className="w-full max-w-[42px] flex items-end justify-center gap-1.5 h-44">
                    <div
                      className="w-1/2 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-md transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightTotal}px` }}
                      title={`Total: ${d.total}`}
                    />
                    <div
                      className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightAnalyzed}px` }}
                      title={`Analyzed: ${d.analyzed}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights & Manager Review Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Section 4.3 AI Insights</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">Manager Action Required</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {insights.recommendation}
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-semibold text-rose-200">
                    Review Required Interactions
                  </span>
                </div>
                <span className="font-extrabold text-sm text-rose-400">
                  {insights.reviewRequiredCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-200">
                    Top Missed Product
                  </span>
                </div>
                <span className="font-extrabold text-sm text-amber-300">
                  {insights.topMissedProduct} ({insights.topMissedPercentage}%)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/recordings')}
            className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
          >
            Inspect In Recordings Library &rarr;
          </button>
        </div>
      </div>

      {/* Missed by Category Breakdown (Section 4.3.3) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Missed Opportunities by Category
            </h2>
            <p className="text-xs text-slate-400">
              Breakdown of lost hardware and accessory revenue detected by audio analysis
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Charger &bull; Phone models &bull; Cases &bull; Warranty
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryBreakdown.map((cat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200">{cat.category}</span>
                <span className="font-mono text-sky-400 font-bold">{cat.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                <span>{cat.count} instances flagged</span>
                {cat.estimatedLoss > 0 && (
                  <span className="text-rose-400 font-semibold font-mono">
                    -${cat.estimatedLoss}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
