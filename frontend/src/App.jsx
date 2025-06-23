// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage'; // Die einfache Startseite
import SearchAlertsPage from './SearchAlertsPage'; // Die Suchauftragsverwaltung mit LLM-Funktion
import JobSearchAndResultsPage from './JobSearchAndResultsPage'; // Die neue Jobsuche und Ergebnisse

function App() {
  return (
    <Router>
      <div className="font-inter antialiased">
        {/* Navigationsleiste */}
        <nav className="bg-gray-800 p-4 text-white shadow-lg">
          <ul className="flex justify-center space-x-6">
            <li>
              <Link to="/" className="text-lg font-semibold hover:text-blue-400 transition duration-200">
                Home
              </Link>
            </li>
            <li>
              <Link to="/jobs" className="text-lg font-semibold hover:text-blue-400 transition duration-200">
                Jobs suchen
              </Link>
            </li>
            <li>
              <Link to="/alerts" className="text-lg font-semibold hover:text-blue-400 transition duration-200">
                Meine Suchaufträge
              </Link>
            </li>
          </ul>
        </nav>

        {/* Routen-Definitionen */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobSearchAndResultsPage />} /> {/* Neue Route für Jobsuche */}
          <Route path="/alerts" element={<SearchAlertsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
