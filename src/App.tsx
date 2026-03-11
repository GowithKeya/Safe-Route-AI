/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SOS from './pages/SOS';
import Login from './pages/Login';
import SafeRoute from './pages/SafeRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/safe-route" element={<SafeRoute />} />
      </Routes>
    </Router>
  );
}
