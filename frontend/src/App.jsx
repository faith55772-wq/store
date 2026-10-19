import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import StoreApprovals from './pages/StoreApprovals';
import LiveMonitor from './pages/LiveMonitor';
import RecordingsLibrary from './pages/RecordingsLibrary';
import RecordingDetail from './pages/RecordingDetail';
import DailyReports from './pages/DailyReports';
import StoreClientTerminal from './pages/StoreClientTerminal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="approvals" element={<StoreApprovals />} />
          <Route path="live" element={<LiveMonitor />} />
          <Route path="recordings" element={<RecordingsLibrary />} />
          <Route path="recordings/:id" element={<RecordingDetail />} />
          <Route path="reports" element={<DailyReports />} />
          <Route path="terminal" element={<StoreClientTerminal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
