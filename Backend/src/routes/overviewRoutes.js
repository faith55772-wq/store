const express = require('express');
const router = express.Router();
const Recording = require('../models/Recording');
const Store = require('../models/Store');

// Overview Dashboard Statistics (Section 4.3)
router.get('/stats', async (req, res) => {
  try {
    const { storeId } = req.query;
    const filter = {};
    if (storeId && storeId !== 'all') {
      filter.storeId = storeId;
    }

    // 1. Top KPI Cards
    const totalConversations = await Recording.countDocuments(filter);
    const analyzedConversations = await Recording.countDocuments({
      ...filter,
      'aiAnalysis.analyzed': true,
    });
    const missedOpportunities = await Recording.countDocuments({
      ...filter,
      'aiAnalysis.missedOpportunity.detected': true,
    });
    const salesOpportunities = await Recording.countDocuments({
      ...filter,
      $or: [
        { 'aiAnalysis.salesOutcome': 'Sold' },
        { 'aiAnalysis.opportunityType': { $in: ['Closed Won', 'Upsell Missed', 'Accessory Missed'] } },
      ],
    });

    // 2. Conversation Activity Graph (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activityByDay = await Recording.aggregate([
      {
        $match: {
          ...filter,
          startTime: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          total: { $sum: 1 },
          analyzed: {
            $sum: { $cond: ['$aiAnalysis.analyzed', 1, 0] },
          },
          missed: {
            $sum: { $cond: ['$aiAnalysis.missedOpportunity.detected', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format all last 7 days even if 0 conversations
    const last7DaysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysMap[dateKey] = { date: dateKey, day: dayName, total: 0, analyzed: 0, missed: 0 };
    }

    activityByDay.forEach((item) => {
      if (last7DaysMap[item._id]) {
        last7DaysMap[item._id].total = item.total;
        last7DaysMap[item._id].analyzed = item.analyzed;
        last7DaysMap[item._id].missed = item.missed;
      }
    });

    const activityChartData = Object.values(last7DaysMap);

    // 3. AI Insights & Missed by Category Breakdown
    const missedCategoriesAgg = await Recording.aggregate([
      {
        $match: {
          ...filter,
          'aiAnalysis.missedOpportunity.detected': true,
        },
      },
      {
        $group: {
          _id: '$aiAnalysis.missedOpportunity.category',
          count: { $sum: 1 },
          estimatedLoss: { $sum: '$aiAnalysis.missedOpportunity.estimatedLoss' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const defaultCategories = [
      { category: 'Charger', count: 0, percentage: 0 },
      { category: 'Phone models', count: 0, percentage: 0 },
      { category: 'Protective Case', count: 0, percentage: 0 },
      { category: 'Warranty', count: 0, percentage: 0 },
      { category: 'Other', count: 0, percentage: 0 },
    ];

    let totalMissedCount = 0;
    missedCategoriesAgg.forEach((item) => {
      totalMissedCount += item.count;
    });

    const categoryBreakdown = defaultCategories.map((def) => {
      const found = missedCategoriesAgg.find((m) => m._id && m._id.toLowerCase().includes(def.category.toLowerCase()));
      const count = found ? found.count : 0;
      const percentage = totalMissedCount > 0 ? Math.round((count / totalMissedCount) * 100) : 0;
      return {
        category: def.category,
        count,
        percentage,
        estimatedLoss: found ? found.estimatedLoss : 0,
      };
    });

    // Count how many conversations require manager review (Negative sentiment or score < 7)
    const reviewRequiredCount = await Recording.countDocuments({
      ...filter,
      $or: [
        { 'aiAnalysis.customerSentiment': 'Negative' },
        { 'aiAnalysis.performanceScore': { $lte: 6 } },
      ],
    });

    const highLevelInsights = {
      reviewRequiredCount,
      topMissedProduct: categoryBreakdown[0]?.category || 'Charger',
      topMissedPercentage: categoryBreakdown[0]?.percentage || 45,
      recommendation: 'Mandate attaching a 30W charging adapter to every new phone checkout to capture immediate high-margin revenue.',
    };

    res.json({
      success: true,
      kpis: {
        totalConversations,
        analyzedConversations,
        missedOpportunities,
        salesOpportunities,
      },
      activityChartData,
      categoryBreakdown,
      highLevelInsights,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
