// frontend/src/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Importiere Link für die Navigation

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-inter antialiased flex items-center justify-center">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6">Willkommen zur Job-App!</h1>
        <p className="text-gray-700 text-lg mb-8">
          Nutzen Sie die Navigation oben, um Jobs zu suchen oder Ihre vorhandenen Suchaufträge zu verwalten.
        </p>
        <div className="flex justify-center space-x-4">
          {/* Link zur Jobsuche */}
          <Link to="/jobs" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition duration-200">
            Jobs suchen
          </Link>
          {/* Link zum Suchauftragsmanager */}
          <Link to="/alerts" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition duration-200">
            Meine Suchaufträge verwalten
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
