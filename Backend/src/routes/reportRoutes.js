const express = require('express');
const router = express.Router();
const DailyReport = require('../models/DailyReport');
const { generateDailyReport, generatePrintablePdfHtml } = require('../services/dailyReportService');

// Get Daily Report for given date and store (Section 5)
router.get('/daily', async (req, res) => {
  try {
    const { date, storeId = 'all' } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let report = await DailyReport.findOne({ date: targetDate, storeId });

    if (!report) {
      // Auto-generate if not yet generated
      report = await generateDailyReport(targetDate, storeId);
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Run AI Analysis for entire day (Section 5: "Admin selects a date filter and clicks Run AI Analysis")
router.post('/daily/analyze', async (req, res) => {
  try {
    const { date, storeId = 'all' } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log(`[DailyReport] Generating full-day collective AI analysis for date: ${targetDate}, store: ${storeId}`);
    const report = await generateDailyReport(targetDate, storeId);

    res.json({
      success: true,
      message: `Daily AI report generated successfully for ${targetDate}`,
      report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download / Print PDF report view adhering to Section 5
router.get('/daily/pdf', async (req, res) => {
  try {
    const { date, storeId = 'all' } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let report = await DailyReport.findOne({ date: targetDate, storeId });
    if (!report) {
      report = await generateDailyReport(targetDate, storeId);
    }

    const html = generatePrintablePdfHtml(report);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send(`Error generating PDF: ${err.message}`);
  }
});

module.exports = router;
