const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    headlineBanner: {
      type: String,
      default: 'Active day, $400 in sales, 4 conversations',
    },
    // 6 Summary KPI Cards (Section 5.2)
    kpis: {
      revenue: {
        totalAmount: { type: Number, default: 0 },
        itemsSold: { type: Number, default: 0 },
      },
      missed: {
        potentialAmount: { type: Number, default: 0 },
        missedOpportunitiesCount: { type: Number, default: 0 },
      },
      conversations: {
        totalCount: { type: Number, default: 0 },
      },
      avgTicket: {
        amount: { type: Number, default: 0 },
      },
      lowStock: {
        count: { type: Number, default: 0 },
      },
      redacted: {
        count: { type: Number, default: 0 },
      },
    },
    // Executive Summary & Key Points (Section 5.3)
    executiveSummary: {
      type: String,
      default: '',
    },
    keyPoints: [{ type: String }],
    // Customer Sentiment Breakdown (Section 5.4)
    sentimentDistribution: {
      positivePercent: { type: Number, default: 60 },
      neutralPercent: { type: Number, default: 30 },
      negativePercent: { type: Number, default: 10 },
      positiveCount: { type: Number, default: 0 },
      neutralCount: { type: Number, default: 0 },
      negativeCount: { type: Number, default: 0 },
    },
    // Actions For Tomorrow (Section 5.5)
    actionsForTomorrow: [{ type: String }],
    // Conversations & Transcripts Breakdown (Section 5.6)
    interactions: [
      {
        interactionNumber: { type: Number },
        recordingId: { type: String },
        exactTime: { type: String },
        location: { type: String },
        durationSeconds: { type: Number },
        sentimentTag: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
        performanceScore: { type: Number },
        transcriptSummary: { type: String },
        coachingTip: { type: String },
        missedOpportunityAlert: { type: String, default: '' },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyReport', DailyReportSchema);
