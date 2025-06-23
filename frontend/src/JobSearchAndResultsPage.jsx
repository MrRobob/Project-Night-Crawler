// frontend/src/JobSearchAndResultsPage.jsx
import React, { useState, useEffect } from 'react';

function JobSearchAndResultsPage() {
  const [keywords, setKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(30);
  const [email, setEmail] = useState('');
  const [jobs, setJobs] = useState([]); // Zustand für die gefundenen Jobs
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:3050';

  // Funktion zum Anzeigen von Nachrichten
  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Keywords hinzufügen
  const handleAddKeyword = () => {
    if (newKeywordInput.trim() !== '' && !keywords.includes(newKeywordInput.trim())) {
      setKeywords([...keywords, newKeywordInput.trim()]);
      setNewKeywordInput('');
    }
  };

  // Keyword entfernen
  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(kw => kw !== keywordToRemove));
  };

  // Jobsuche durchführen
  const handleSearchJobs = async () => {
    setLoading(true);
    setJobs([]); // Vorherige Ergebnisse leeren
    try {
      const response = await fetch(`${API_BASE_URL}/jobsuchen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords,
          location: location,
          radius: radius,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setJobs(data);
        if (data.length === 0) {
          showMessage('Keine Jobs für die angegebenen Kriterien gefunden.', 'info');
        } else {
          showMessage(`${data.length} Jobs gefunden.`, 'success');
        }
      } else {
        showMessage(`Fehler bei der Jobsuche: ${data.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Fehler bei der Jobsuche:', error);
      showMessage(`Netzwerkfehler bei der Jobsuche: ${error.message}. Ist das Backend aktiv?`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lesezeichen aktualisieren
  const handleBookmarkChange = async (jobId, isBookmarked) => {
    // Aktualisiere den Zustand der Jobs im Frontend sofort für bessere UX
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job._id === jobId ? { ...job, bookmark: isBookmarked } : job
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/update_bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: jobId, bookmark: isBookmarked }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        // Bei Fehler: Zustand im Frontend zurücksetzen und Fehler anzeigen
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job._id === jobId ? { ...job, bookmark: !isBookmarked } : job
          )
        );
        showMessage(`Fehler beim Aktualisieren des Lesezeichens: ${data.message || response.statusText}`, 'error');
      } else {
        showMessage(data.message, 'success');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Lesezeichens:', error);
      // Bei Netzwerkfehler: Zustand im Frontend zurücksetzen
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job._id === jobId ? { ...job, bookmark: !isBookmarked } : job
        )
      );
      showMessage(`Netzwerkfehler beim Aktualisieren des Lesezeichens: ${error.message}`, 'error');
    }
  };


  // Suchauftrag speichern
  const handleSaveSearchAlert = async () => {
    if (keywords.length === 0 || !location.trim() || !email.trim()) {
      showMessage('Bitte geben Sie Keywords, Ort und E-Mail für den Suchauftrag ein.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/save_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords,
          location: location,
          radius: radius,
          email: email,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(data.message, 'success');
        // Optional: Formularfelder zurücksetzen, falls gewünscht
        // setKeywords([]);
        // setLocation('');
        // setEmail('');
        // setRadius(30);
      } else {
        showMessage(`Fehler beim Speichern des Suchauftrags: ${data.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Suchauftrags:', error);
      showMessage(`Netzwerkfehler beim Speichern des Suchauftrags: ${error.message}. Ist das Backend aktiv?`, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 p-8 font-inter antialiased">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
          IT ist Zukunft, IT ist alles!
        </h1>

        {/* Nachrichtenbereich */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg text-white ${messageType === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {message}
          </div>
        )}

        {/* Suchformular */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Neuen Suchbegriff eingeben"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Verhindert das Absenden des Formulars
                  handleAddKeyword();
                }
              }}
            />
            <button
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition duration-200"
            >
              Suchbegriff hinzufügen
            </button>
          </div>

          {/* Angezeigte Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {keywords.map((kw, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="ml-2 -mr-1 text-blue-600 hover:text-blue-900 focus:outline-none"
                  >
                    X
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ort"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <select
              className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
            >
              <option value={10}>10km</option>
              <option value={30}>30km</option>
              <option value={50}>50km</option>
              <option value={100}>100km</option>
            </select>
            <button
              onClick={handleSearchJobs}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Suche läuft...' : 'Jobs finden'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="email"
              className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email-Adresse eingeben"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSaveSearchAlert}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition duration-200 disabled:opacity-50"
              disabled={loading || keywords.length === 0 || !location.trim() || !email.trim()}
            >
              Suchauftrag speichern
            </button>
          </div>

          {/* Zukünftige Navigations-Buttons (nicht Teil dieser Seite) */}
          <div className="flex justify-center space-x-4 mt-6">
            <button className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow cursor-not-allowed">
              Gespeicherte Lesezeichen (zukünftig)
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow cursor-not-allowed">
              Gespeicherte Suchaufträge (zukünftig)
            </button>
          </div>
        </div>

        {/* Gefundene Jobs */}
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Gefundene Jobs:</h2>
        {loading && jobs.length === 0 ? (
          <p className="text-center text-gray-600">Jobs werden geladen...</p>
        ) : jobs.length === 0 ? (
          <p className="text-center text-gray-600">Keine Ergebnisse gefunden.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id || job.link} // Verwende _id falls vorhanden, sonst link als Fallback
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="flex-grow mb-2 md:mb-0">
                  <p className="text-lg font-semibold text-gray-800">{job.title}</p>
                  <p className="text-gray-600">{job.company}</p>
                  <p className="text-gray-500 text-sm">{job.location}</p>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Details
                  </a>
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <label htmlFor={`bookmark-${job._id || job.link}`} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={`bookmark-${job._id || job.link}`}
                      checked={job.bookmark || false} // Sicherstellen, dass es immer einen Booleschen Wert hat
                      onChange={(e) => handleBookmarkChange(job._id || job.link, e.target.checked)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700 text-sm">Speichern</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSearchAndResultsPage;
