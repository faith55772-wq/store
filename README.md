# Store Listener (StoreAI) — AI Sales Monitoring & Conversation Intelligence Platform

A production-ready **MERN Stack** (MongoDB, Express, React, Node.js) Retail Conversation Intelligence platform integrated with **Deepgram Nova-2 Multilingual Speech-to-Text** and **Socket.IO Real-Time WebSockets**.

Strictly engineered according to the complete requirements in `Store Listiner Specifications.md`.

---

## 🏗️ Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │    Windows Desktop Client / Terminal (.exe)  │
                        │  - Multi-mic hardware enumeration            │
                        │  - Approval gate & Auto-start on approval    │
                        │  - Bilingual audio capture (EN + ES)         │
                        │  - Deepgram real-time streaming              │
                        └──────────────────────┬───────────────────────┘
                                               │
                                 Secure WebSocket / HTTPS
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │           Node.js & Express Backend          │
                        │  - Socket.IO Real-time streaming server      │
                        │  - Deepgram Nova-2 Bilingual STT & Translate │
                        │  - AI Single-audio analysis engine           │
                        │  - Section 5 Daily Report generator          │
                        └──────────────┬───────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐
         │      MongoDB Atlas      │       │    React Admin Portal   │
         │  - Stores & Approvals   │       │  - Overview Dashboard   │
         │  - Diarized Recordings  │       │  - Store Approvals Gate │
         │  - Section 5 Reports    │       │  - Live Monitor Stream  │
         │  - Admin Credentials    │       │  - Single Audio Player  │
         │                         │       │  - Section 5 PDF Export │
         └─────────────────────────┘       └─────────────────────────┘
```

---

## 🎯 Component Alignment with Specifications

### Component 1: Desktop Client Application (.exe / Terminal)
- **3.1 Store Registration & Admin Approval Gate**: Store submits registration and enters `pending` approval gate. Audio recording is blocked until Admin approves from the Web Portal.
- **3.2 Auto-Start & Auto-Off**:
  - Auto-starts recording immediately upon Admin approval signal via WebSocket.
  - Auto-starts on system boot/page load.
  - Auto-stops on system shutdown/close.
  - Manual Start/Stop recording override buttons.
- **3.3 Hardware Microphone Detection**:
  - Automatically enumerates all connected physical microphones via `navigator.mediaDevices.enumerateDevices()`.
  - Dropdown selector to choose active input device.
  - Live timer (`00:00:34`) and active audio waveform visualizer.
- **3.4 Bilingual Speech Detection & Real-Time English Transcription**:
  - Detects English and Spanish speech using Deepgram Nova-2.
  - Always outputs English in real time (Spanish speech is immediately translated to English text).

### Component 2: Centralized Web Portal (Admin Dashboard)
- **4.1 Store Approvals Module**: Review pending store requests, inspect device info, and approve/reject with instant WebSocket auto-start trigger.
- **4.2 Live Monitor Module**:
  - Global stream listener monitoring all stores.
  - Dynamic **LIVE** (green pulsing badge) vs **ENDED** (red badge) status indicator.
  - Synchronized word-for-word real-time English transcript streaming live without delay.
- **4.3 Overview Dashboard**:
  - 4 Top KPI Cards: Total Conversations, Analyzed Conversations, Missed Opportunities, Sales Opportunities.
  - 7-Day Conversation Activity line/bar chart.
  - AI Insights and Missed by Category breakdown (Charger, Phone models, Cases, Warranty).
  - Download PDF button.
- **4.4 Recordings Library & Single-Audio AI Analysis**:
  - Recordings table with filters, timestamps, snippets, and detail analysis links.
  - Single Conversation Detail View: Header info, audio player with seek bar and waveform visualizer, "Generate AI Report" button, **Missed Opportunity Alert Box** (highlighted in prominent alert), Structured AI Analysis panel (Summary, Needs, Sentiment, Products Discussed, Opportunity Type), and **Speaker-Separated Transcript** (Customer [C] vs Representative [R] chat bubbles).

### Component 3: Daily Reports Module (Strict Section 5 PDF Specification)
- Date filter + "Run AI Analysis" button.
- **5.1 Report Header**: STORE LISTENER branding, Report Date, Headline Banner (`Active day, $400 in sales, 4 conversations`), Store & Timestamp.
- **5.2 Six Summary KPI Cards**: REVENUE (total $ and items sold), MISSED ($ potential revenue), CONVERSATIONS, AVG TICKET, LOW STOCK count, REDACTED PII details count.
- **5.3 Daily Executive Summary & Key Points**: Narrative summary paragraph and bulleted takeaways list.
- **5.4 Customer Sentiment Visual Chart**: Percentage breakdown of sentiment across the entire day.
- **5.5 Actions For Tomorrow**: Numbered AI recommendations (1, 2, 3...) for staff and store manager.
- **5.6 Conversations & Transcripts Breakdown**: Interaction-by-interaction cards with metadata, duration, sentiment, AI score, quote summary, and coaching tips.
- **PDF Export**: Print-ready high-resolution PDF download button matching exact branding.

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas (Connection string already provided in `.env`)
- Deepgram API Key (Already configured)

### 2. Setup Backend
```bash
cd Backend
npm install
npm run seed     # Populates admin, sample stores, rich recordings, and daily report
npm start        # Starts server on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Render.com Deployment

See [RENDER_DEPLOYMENT.md](file:///c:/Users/Mr%20Ali%20Raza%20Dvpr/Videos/Store%20listen/store/RENDER_DEPLOYMENT.md) for full instructions:
- **Automatic Blueprint**: Connect `faith55772-wq/store` on `dashboard.render.com/select-repo?type=blueprint`. Render automatically provisions both the Backend and Frontend with pre-configured variables from `render.yaml`.
- **Manual**: Deploy `Backend/` as a Node Web Service and `frontend/` as a Static Site.
