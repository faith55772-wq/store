import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  TrendingUp,
  Download,
  AlertTriangle,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
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
  const maxDayTotal = Math.max(...chartData.map((d) => d.total || 0), 6);

  const categoryBreakdown = data?.categoryBreakdown || [
    { category: 'Charger', percentage: 45, count: 5 },
    { category: 'Phone models', percentage: 30, count: 3 },
    { category: 'Protective Case', percentage: 15, count: 2 },
    { category: 'Warranty', percentage: 10, count: 1 },
    { category: 'Other', percentage: 5, count: 1 },
  ];

  const insights = data?.highLevelInsights || {
    reviewRequiredCount: 2,
    topMissedProduct: 'Charger',
    topMissedPercentage: 45,
    recommendation: 'Ensure sales associates proactively confirm charging block compatibility with each smartphone checkout to capture high-margin accessory revenue.',
  };

  const handleDownloadPdf = () => {
    const today = new Date().toISOString().split('T')[0];
    const url = api.getPdfReportUrl(today, selectedStore);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header with Title and Download PDF Button (Section 4.3.4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1f2737]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Sales & Conversation Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time customer interaction telemetry, sales attachment tracking, and store analytics.
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary (PDF)</span>
        </button>
      </div>

      {/* 4 Top KPI Cards (Section 4.3.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Conversations */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total Conversations
            </span>
            <div className="p-2 rounded-md bg-[#18202d] text-slate-300 border border-[#242f42]">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.totalConversations}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Customer interactions captured
            </div>
          </div>
        </div>

        {/* Card 2: Analyzed Conversations */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Evaluated Interactions
            </span>
            <div className="p-2 rounded-md bg-[#18202d] text-slate-300 border border-[#242f42]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.analyzedConversations}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Fully processed by intelligence model
            </div>
          </div>
        </div>

        {/* Card 3: Missed Opportunities */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Missed Opportunities
            </span>
            <div className="p-2 rounded-md bg-[#18202d] text-slate-300 border border-[#242f42]">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.missedOpportunities}
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium mt-1">
              Unrealized accessory & warranty pitches
            </div>
          </div>
        </div>

        {/* Card 4: Sales Opportunities */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Closed Sales Transactions
            </span>
            <div className="p-2 rounded-md bg-[#18202d] text-slate-300 border border-[#242f42]">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.salesOpportunities}
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium mt-1">
              Completed purchases recorded
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: 7-Day Activity Graph & Missed by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Section 4.3.2: 7-Day Activity Graph (7 Cols) */}
        <div className="lg:col-span-7 pro-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1f2737]">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Conversation Volume (Last 7 Days)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daily recorded interactions, evaluated calls, and opportunity patterns.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                  Total
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  Missed
                </span>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {chartData.map((day, idx) => {
                const totalHeight = Math.max(12, Math.round((day.total / maxDayTotal) * 150));
                const missedHeight = Math.max(4, Math.round((day.missed / maxDayTotal) * 150));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Total Bar */}
                      <div
                        className="w-full max-w-[28px] bg-blue-600/80 hover:bg-blue-500 rounded-t-sm transition-all relative flex flex-col justify-end"
                        style={{ height: `${totalHeight}px` }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold bg-[#0f141d] px-1.5 py-0.5 rounded border border-[#242f42] text-white pointer-events-none transition-opacity">
                          {day.total}
                        </span>
                      </div>
                      {/* Missed Bar */}
                      {day.missed > 0 && (
                        <div
                          className="w-full max-w-[14px] bg-amber-500/80 hover:bg-amber-400 rounded-t-sm transition-all relative"
                          style={{ height: `${missedHeight}px` }}
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1f2737] flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated across active physical store lanes</span>
            <button
              onClick={() => navigate('/recordings')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-[11px]"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Section 4.3.3: Missed by Category Breakdown (5 Cols) */}
        <div className="lg:col-span-5 pro-card p-5 space-y-4">
          <div className="pb-2 border-b border-[#1f2737]">
            <h2 className="text-sm font-semibold text-white">
              Missed Revenue by Category
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              High-value attachment products missed during sales consultations.
            </p>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[11px]">{cat.count} missed</span>
                    <span className="font-mono font-semibold text-slate-100 text-[11px] w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#18202d] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-blue-500' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.max(5, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 4.3.3: High-level AI Insights Box */}
          <div className="mt-4 p-3.5 rounded-lg bg-[#161f2c] border border-[#243046] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Manager Review Recommendation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {insights.recommendation}
            </p>
            <div className="pt-2 border-t border-[#243046]/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{insights.reviewRequiredCount} conversations require shift review</span>
              <span className="text-amber-400 font-medium">Top Missed: {insights.topMissedProduct}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
