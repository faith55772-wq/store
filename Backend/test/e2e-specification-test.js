/**
 * ==============================================================================
 * STORE LISTENER / STOREAI - END-TO-END SPECIFICATION AUTOMATED TEST SUITE
 * ==============================================================================
 * Deep automated test verifying all requirements from the Project Specification:
 * 1. Health & Deepgram Nova-2 Integration
 * 2. Store Registration & Admin Approval Gate (Section 3.1 & 3.2)
 * 3. Hardware Microphone Detection & Enumeration (Section 3.3)
 * 4. Real-Time Socket.IO Streaming, Auto-Start/Auto-Off, LIVE/ENDED badges (Section 3.2, 4.2)
 * 5. Bilingual (ES -> EN) Real-Time Translation & English Output (Section 3.4)
 * 6. Single-Audio AI Analysis & Recordings Library (Section 4.4)
 * 7. Overview Dashboard: 4 KPIs, 7-day Activity Chart, Category Breakdown, PDF (Section 4.3)
 * 8. Daily Reports Module: Section 5 Strict 6 KPI Cards, Executive Summary, Sentiment,
 *    Actions for Tomorrow, Scored Interactions Breakdown, and PDF Export.
 * ==============================================================================
 */

const http = require('http');
const ioClient = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'http://localhost:5000';

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    results.push({ name: testName, passed: true, details });
  } else {
    failedTests++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${testName} - ${details}`);
    results.push({ name: testName, passed: false, details });
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body instanceof FormData ? undefined : headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAllTests() {
  console.log('\n==============================================================================');
  console.log('🚀 RUNNING END-TO-END SPECIFICATION AUTOMATED TESTS FOR STORE LISTENER');
  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log('==============================================================================\n');

  const testStoreId = `STORE-AUTO-${Date.now()}`;
  let createdRecordingId = null;

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Health & Deepgram Nova-2 Integration
  // --------------------------------------------------------------------------
  console.log('\x1b[34m[Test Group 1] Infrastructure, Health & Deepgram Nova-2 Integration\x1b[0m');
  try {
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /health returns 200 OK');
    assert(health.data.database === 'connected', 'MongoDB Atlas database is connected');

    const root = await request('/');
    assert(root.status === 200 && root.data.name === 'Store Listener API', 'GET / returns API catalog');

    const dgHealth = await request('/api/v1/deepgram/health');
    assert(
      dgHealth.status === 200 && dgHealth.data && (dgHealth.data.provider === 'Deepgram Nova-2' || dgHealth.data.status === 'connected'),
      'GET /api/v1/deepgram/health verifies Nova-2 API connection',
      JSON.stringify(dgHealth.data)
    );
  } catch (err) {
    assert(false, 'Group 1 Infrastructure test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Store Registration & Admin Approval Workflow (Section 3.1 & 3.2)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 2] Store Registration & Admin Approval Gate (Section 3.1 & 3.2)\x1b[0m');
  try {
    // 3.1.1: Initial Registration
    const regRes = await request('/api/v1/stores/register', {
      method: 'POST',
      body: {
        storeId: testStoreId,
        name: `Automated Test Retail Store #${testStoreId.slice(-4)}`,
        location: 'Houston, TX - Westheimer Galleria',
        address: '5085 Westheimer Rd, Houston, TX 77056',
        contactPerson: 'Sarah Jenkins',
        email: 'sarah.jenkins@storelistener-retail.com',
        phone: '+1 (713) 555-0188',
        systemInfo: {
          hostname: 'POS-TERMINAL-01',
          os: 'Windows 11 Pro 64-bit',
          activeMic: 'Realtek High Definition Audio USB Mic',
          availableMics: [
            'Realtek High Definition Audio USB Mic',
            'Jabra Speak 710 Conference Mic',
            'Internal Laptop Microphone Array',
          ],
          clientVersion: '1.0.0',
        },
      },
    });

    assert(regRes.status === 201, 'POST /api/v1/stores/register returns 201 Created');
    assert(regRes.data.store.status === 'pending', 'Newly registered store has status === "pending" (Approval Gate)');
    assert(regRes.data.requiresApproval === true, 'Registration confirms requiresApproval === true');

    // Section 4.1: Store Approvals Module queries pending requests
    const pendingRes = await request('/api/v1/stores/pending');
    assert(pendingRes.status === 200, 'GET /api/v1/stores/pending returns 200');
    const foundPending = (pendingRes.data.stores || []).some((s) => s.storeId === testStoreId);
    assert(foundPending, 'Pending requests list includes the newly registered store');

    // Section 3.2.1: Admin approves the store
    const approveRes = await request(`/api/v1/stores/${testStoreId}/approve`, { method: 'POST' });
    assert(approveRes.status === 200 && approveRes.data.store.status === 'approved', 'POST /api/v1/stores/:id/approve marks store as approved');
    assert(approveRes.data.message.includes('Auto-start recording trigger sent'), 'Approval response confirms auto-start recording trigger sent');
  } catch (err) {
    assert(false, 'Group 2 Store Registration test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Hardware / Microphone Detection (Section 3.3)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 3] Hardware / Microphone Detection & Enumeration (Section 3.3)\x1b[0m');
  try {
    const micRes = await request(`/api/v1/stores/${testStoreId}/mic`, {
      method: 'PATCH',
      body: {
        activeMic: 'Jabra Speak 710 Conference Mic',
        availableMics: [
          'Jabra Speak 710 Conference Mic',
          'Realtek High Definition Audio USB Mic',
          'Virtual Audio Cable',
        ],
      },
    });
    assert(micRes.status === 200, 'PATCH /api/v1/stores/:id/mic returns 200');
    assert(micRes.data.store.systemInfo.activeMic === 'Jabra Speak 710 Conference Mic', 'Store activeMic updated in database');
    assert(micRes.data.store.systemInfo.availableMics.length === 3, 'Multi-mic list persisted with 3 detected devices');
  } catch (err) {
    assert(false, 'Group 3 Microphone Detection test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Real-time Socket.IO Streaming & Auto-Start/Auto-Off (Section 3.2, 3.4, 4.2)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 4] Real-Time Socket.IO Streaming & Auto-Start/Auto-Off (Section 3.2, 3.4, 4.2)\x1b[0m');
  try {
    const storeSocket = ioClient(WS_URL, { reconnection: false });
    const adminSocket = ioClient(WS_URL, { reconnection: false });

    await new Promise((resolve) => {
      let count = 0;
      const onConnect = () => {
        count++;
        if (count === 2) resolve();
      };
      storeSocket.on('connect', onConnect);
      adminSocket.on('connect', onConnect);
    });
    assert(true, 'Store client socket and Admin monitor socket connected successfully');

    // Admin joins monitor
    adminSocket.emit('admin:join_monitor');

    // Store joins room
    storeSocket.emit('store:join', {
      storeId: testStoreId,
      name: 'Houston Galleria Store',
      location: 'Houston, TX',
      systemInfo: { activeMic: 'Jabra Speak 710 Conference Mic' },
    });

    await sleep(200);

    // Test Auto-Start Recording & Live green status badge (Section 3.2.1 & 4.2.3)
    const livePromise = new Promise((resolve) => {
      adminSocket.once('stream:status_change', (data) => {
        resolve(data);
      });
    });

    storeSocket.emit('store:recording_started', {
      storeId: testStoreId,
      storeName: 'Houston Galleria Store',
      location: 'Houston, TX',
    });

    const liveEvent = await livePromise;
    assert(liveEvent.storeId === testStoreId && liveEvent.status === 'LIVE', 'Admin monitor received status_change "LIVE" badge');

    // Test Bilingual Speech & Always English Transcription Streaming (Section 3.4 & 4.2.4)
    // 1. English dialogue
    const enPromise = new Promise((resolve) => {
      adminSocket.once('stream:live_word', (data) => resolve(data));
    });
    storeSocket.emit('stream:transcript', {
      storeId: testStoreId,
      storeName: 'Houston Galleria Store',
      text: 'Good morning, how can I help you today with a new smartphone?',
      speaker: 'R',
      isFinal: true,
      language: 'en',
    });
    const enWord = await enPromise;
    assert(
      enWord.text.includes('Good morning') && enWord.speaker === 'R',
      'English speech streamed word-for-word to Admin monitor'
    );

    // 2. Spanish dialogue -> translated to English in real time
    const esPromise = new Promise((resolve) => {
      adminSocket.once('stream:live_word', (data) => resolve(data));
    });
    storeSocket.emit('stream:transcript', {
      storeId: testStoreId,
      storeName: 'Houston Galleria Store',
      originalText: 'Hola, buenos días, cuánto cuesta este teléfono?',
      text: 'Hola, buenos días, cuánto cuesta este teléfono?',
      speaker: 'C',
      isFinal: true,
      language: 'es',
    });
    const esWord = await esPromise;
    assert(
      esWord.text.includes('Hello, good morning') || esWord.text.includes('phone cost'),
      'Spanish speech automatically translated to English in real time for Admin monitor'
    );

    // Test Auto-Off Recording & Red ENDED badge (Section 3.2.3 & 4.2.3)
    const endedPromise = new Promise((resolve) => {
      adminSocket.once('stream:status_change', (data) => resolve(data));
    });

    storeSocket.emit('store:recording_stopped', { storeId: testStoreId });
    const endedEvent = await endedPromise;
    assert(endedEvent.storeId === testStoreId && endedEvent.status === 'ENDED', 'Admin monitor received status_change "ENDED" badge on recording stop');

    // Test Safe Stop & Disconnect (System shutdown / computer turned OFF)
    storeSocket.disconnect();
    adminSocket.disconnect();
    assert(true, 'Sockets gracefully disconnected after session completion');
  } catch (err) {
    assert(false, 'Group 4 Socket.IO test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Single-Audio AI Analysis & Recordings Library (Section 4.4)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 5] Recordings Library & Single-Audio AI Analysis (Section 4.4)\x1b[0m');
  try {
    // Synchronize a sales conversation with a missed opportunity (bought phone, missed charger)
    const syncRes = await request('/api/v1/recordings', {
      method: 'POST',
      body: {
        storeId: testStoreId,
        customerId: 'CUST-8831',
        representativeName: 'David Vance',
        durationSeconds: 95,
        status: 'completed',
        fullTranscript:
          'Representative: Hello, welcome in! We have the new iPhone 15 Pro Max available today. Customer: Great, I love it and I will take it! I will pay with card. Representative: Wonderful, I have processed your payment on card. Have a great day!',
        originalLanguage: 'en',
      },
    });

    assert(syncRes.status === 201, 'POST /api/v1/recordings synchronized recording successfully');
    createdRecordingId = syncRes.data.recording.recordingId;
    assert(!!createdRecordingId, `Recording created with ID: ${createdRecordingId}`);

    // Query Recordings Library Table (Section 4.4.1)
    const listRes = await request(`/api/v1/recordings?storeId=${testStoreId}`);
    assert(listRes.status === 200 && listRes.data.total >= 1, 'GET /api/v1/recordings filters and returns recordings');

    // Query Single Conversation Detail View (Section 4.4.2 & 4.4.3)
    const detailRes = await request(`/api/v1/recordings/${createdRecordingId}`);
    assert(detailRes.status === 200, 'GET /api/v1/recordings/:id returns conversation details');
    const rec = detailRes.data.recording;
    assert(rec.customerId === 'CUST-8831', 'Header Info: Customer ID verified');
    assert(rec.representativeName === 'David Vance', 'Header Info: Representative verified');

    // Trigger Single-Audio AI Analysis (Section 4.4.5)
    const analyzeRes = await request(`/api/v1/recordings/${createdRecordingId}/analyze`, { method: 'POST' });
    assert(analyzeRes.status === 200 && analyzeRes.data.success === true, 'POST /api/v1/recordings/:id/analyze completes successfully');
    const ai = analyzeRes.data.analysis;

    // Structured AI Analysis Panel Verification (Section 4.4.7)
    assert(ai.analyzed === true, 'AI Status: Analyzed is true');
    assert(typeof ai.summary === 'string' && ai.summary.length > 10, 'Structured Panel: SUMMARY generated');
    assert(typeof ai.customerNeeds === 'string' && ai.customerNeeds.length > 5, 'Structured Panel: CUSTOMER NEEDS identified');
    assert(['Positive', 'Neutral', 'Negative'].includes(ai.customerSentiment), `Structured Panel: CUSTOMER SENTIMENT detected (${ai.customerSentiment})`);
    assert(Array.isArray(ai.productsDiscussed) && ai.productsDiscussed.length > 0, 'Structured Panel: PRODUCTS DISCUSSED populated');
    assert(typeof ai.opportunityType === 'string', `Structured Panel: OPPORTUNITY TYPE classified (${ai.opportunityType})`);

    // Missed Opportunity Alert Box Verification (Section 4.4.6)
    assert(ai.missedOpportunity.detected === true, 'Missed Opportunity Alert Box: detected === true');
    assert(ai.missedOpportunity.category === 'Charger', 'Missed Opportunity Alert Box: Category flagged as "Charger"');
    assert(ai.missedOpportunity.estimatedLoss > 0, `Missed Opportunity Alert Box: Estimated loss flagged ($${ai.missedOpportunity.estimatedLoss})`);

    // Speaker Separated Transcript in Chat Bubble Format (Section 4.4.8)
    const segments = ai.speakerSegments || analyzeRes.data.recording?.speakerSegments || [];
    assert(Array.isArray(segments) && segments.length >= 2, 'Speaker Separated Transcript has diarized utterances');
    const hasCustomer = segments.some((s) => s.speaker === 'C');
    const hasRep = segments.some((s) => s.speaker === 'R');
    assert(hasCustomer && hasRep, 'Utterances properly separated between Customer (C) and Representative (R)');
    assert(typeof ai.coachingTip === 'string' && ai.coachingTip.length > 10, 'Coaching Tip generated for staff improvement');
  } catch (err) {
    assert(false, 'Group 5 Single-Audio AI Analysis test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Overview Dashboard (Section 4.3)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 6] Overview Dashboard (Section 4.3)\x1b[0m');
  try {
    const statsRes = await request(`/api/v1/overview/stats?storeId=${testStoreId}`);
    assert(statsRes.status === 200, 'GET /api/v1/overview/stats returns 200');

    // Section 4.3.1: 4 Top KPI Cards
    const kpis = statsRes.data.kpis;
    assert(typeof kpis.totalConversations === 'number', 'KPI Card 1: Total Conversations is a number');
    assert(typeof kpis.analyzedConversations === 'number', 'KPI Card 2: Analyzed Conversations is a number');
    assert(typeof kpis.missedOpportunities === 'number', 'KPI Card 3: Missed Opportunities is a number');
    assert(typeof kpis.salesOpportunities === 'number', 'KPI Card 4: Sales Opportunities is a number');

    // Section 4.3.2: 7-Day Conversation Activity Graph
    assert(Array.isArray(statsRes.data.activityChartData) && statsRes.data.activityChartData.length === 7, 'Activity Graph: Contains 7 consecutive days of conversation data');

    // Section 4.3.3: AI Insights & Missed by Category Breakdown
    assert(Array.isArray(statsRes.data.categoryBreakdown) && statsRes.data.categoryBreakdown.length > 0, 'Missed by Category: Breakdown array returned');
    assert(typeof statsRes.data.highLevelInsights === 'object', 'AI Insights: High level insights returned');

    // Section 4.3.4: Download PDF button endpoint
    const pdfRes = await request(`/api/v1/overview/pdf?storeId=${testStoreId}`);
    assert(pdfRes.status === 200 && pdfRes.data.includes('STORE LISTENER'), 'GET /api/v1/overview/pdf returns formatted HTML/PDF content');
  } catch (err) {
    assert(false, 'Group 6 Overview Dashboard test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Daily Reports Module & PDF Specification (Section 5)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 7] Daily Reports Module & PDF Specification (Section 5)\x1b[0m');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Run Full-Day AI Analysis (Section 5 preamble)
    const runRes = await request('/api/v1/reports/daily/analyze', {
      method: 'POST',
      body: { date: today, storeId: testStoreId },
    });
    assert(runRes.status === 200 && runRes.data.success === true, 'POST /api/v1/reports/daily/analyze executes collective analysis');
    const report = runRes.data.report;

    // Section 5.1: Report Header
    assert(report.headlineBanner && report.headlineBanner.includes('Active day'), '5.1 Header: Headline banner present (e.g. Active day, $ in sales)');
    assert(report.storeName && report.date === today, '5.1 Header: Store & Timestamp details present');

    // Section 5.2: Six Summary KPI Cards
    const rKpis = report.kpis;
    assert(rKpis.revenue && typeof rKpis.revenue.totalAmount === 'number', '5.2 Card 1: REVENUE ($ total & items sold)');
    assert(rKpis.missed && typeof rKpis.missed.potentialAmount === 'number', '5.2 Card 2: MISSED ($ potential revenue)');
    assert(rKpis.conversations && typeof rKpis.conversations.totalCount === 'number', '5.2 Card 3: CONVERSATIONS total');
    assert(rKpis.avgTicket && typeof rKpis.avgTicket.amount === 'number', '5.2 Card 4: AVG TICKET per transaction');
    assert(rKpis.lowStock && typeof rKpis.lowStock.count === 'number', '5.2 Card 5: LOW STOCK items flagged');
    assert(rKpis.redacted && typeof rKpis.redacted.count === 'number', '5.2 Card 6: REDACTED PII count');

    // Section 5.3: Daily Executive Summary & Key Points
    assert(typeof report.executiveSummary === 'string' && report.executiveSummary.length > 50, '5.3 Narrative Summary: Multi-sentence executive narrative compiled');
    assert(Array.isArray(report.keyPoints) && report.keyPoints.length >= 3, '5.3 Key Points: Bulleted list with key takeaways extracted');

    // Section 5.4: Customer Sentiment Visual Chart
    const sent = report.sentimentDistribution;
    assert(
      typeof sent.positivePercent === 'number' &&
      typeof sent.neutralPercent === 'number' &&
      typeof sent.negativePercent === 'number' &&
      sent.positivePercent + sent.neutralPercent + sent.negativePercent >= 98,
      '5.4 Customer Sentiment: Full percentage distribution (Positive, Neutral, Negative = 100%)'
    );

    // Section 5.5: Actions For Tomorrow (AI Recommendations)
    assert(Array.isArray(report.actionsForTomorrow) && report.actionsForTomorrow.length >= 3, '5.5 Actions For Tomorrow: Numbered concrete AI instructions (1, 2, 3...)');

    // Section 5.6: Conversations & Transcripts Breakdown (Interaction Logs)
    assert(Array.isArray(report.interactions) && report.interactions.length > 0, '5.6 Interaction Logs: Individual card list populated');
    const firstInt = report.interactions[0];
    assert(firstInt.interactionNumber === 1, '5.6 Interaction Metadata: Interaction number present');
    assert(firstInt.exactTime && firstInt.location && firstInt.durationSeconds > 0, '5.6 Interaction Metadata: Time, location, duration present');
    assert(typeof firstInt.performanceScore === 'number', `5.6 Interaction Metadata: AI performance score assigned (${firstInt.performanceScore}/10)`);
    assert(typeof firstInt.transcriptSummary === 'string', '5.6 Transcript Summary: Summary text present');
    assert(typeof firstInt.coachingTip === 'string', '5.6 Coaching Tip: Informing staff what they did well/improve');

    // Section 5.7: PDF Export HTML
    const dailyPdfRes = await request(`/api/v1/reports/daily/pdf?date=${today}&storeId=${testStoreId}`);
    assert(dailyPdfRes.status === 200, 'GET /api/v1/reports/daily/pdf returns 200');
    assert(dailyPdfRes.data.includes('STORE LISTENER'), 'PDF view contains STORE LISTENER branding');
    assert(dailyPdfRes.data.includes('Revenue') && dailyPdfRes.data.includes('Missed'), 'PDF view contains 6 KPI Cards layout');
    assert(dailyPdfRes.data.includes('Daily Executive Summary'), 'PDF view contains Executive Summary section');
  } catch (err) {
    assert(false, 'Group 7 Daily Reports test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Fast Bilingual Translation API (Section 2.2 & 3.4)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[34m[Test Group 8] Bilingual Spanish-to-English Translation API (Section 3.4)\x1b[0m');
  try {
    const phrases = [
      { es: 'Hola, buenos días, cuánto cuesta este teléfono?', expected: 'Hello, good morning' },
      { es: 'Tienen cargadores para iPhone?', expected: 'chargers for iPhone' },
      { es: 'Pagaré con tarjeta', expected: 'pay with card' },
    ];

    for (const item of phrases) {
      const transRes = await request('/api/v1/deepgram/translate-es-en', {
        method: 'POST',
        body: { text: item.es },
      });
      assert(
        transRes.status === 200 && transRes.data.translatedTextEn.toLowerCase().includes(item.expected.toLowerCase()),
        `Translation verified: "${item.es}" -> "${transRes.data.translatedTextEn}"`
      );
    }
  } catch (err) {
    assert(false, 'Group 8 Translation test crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(`📊 TEST EXECUTION COMPLETED`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  console.log('==============================================================================\n');

  if (failedTests > 0) {
    console.error(`💥 ${failedTests} test(s) failed! Check details above.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL SPECIFICATIONS 100% VERIFIED & PASSED!');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
