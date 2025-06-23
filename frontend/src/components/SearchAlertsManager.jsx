import React, { useState, useEffect } from 'react';

// Hauptkomponente für die Verwaltung von Suchaufträgen
function App() {
  const [searchAlerts, setSearchAlerts] = useState([]); // Zustand für alle Suchaufträge
  const [newKeywords, setNewKeywords] = useState(''); // Zustand für Keywords im Formular
  const [newLocation, setNewLocation] = useState(''); // Zustand für Ort im Formular
  const [newRadius, setNewRadius] = useState(30); // Zustand für Radius im Formular
  const [newEmail, setNewEmail] = useState(''); // Zustand für E-Mail im Formular
  const [editingAlertId, setEditingAlertId] = useState(null); // Zustand für die ID des zu bearbeitenden Suchauftrags
  const [message, setMessage] = useState(''); // Zustand für Benutzer-Nachrichten (Erfolg/Fehler)
  const [messageType, setMessageType] = useState(''); // Typ der Nachricht (success/error)
  const [loading, setLoading] = useState(false); // Ladezustand für API-Anfragen

  const API_BASE_URL = 'http://127.0.0.1:3050'; // Basis-URL deines Flask-Backends

  // Funktion zum Anzeigen von Nachrichten
  const showMessage = React.useCallback((msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // Nachricht nach 5 Sekunden ausblenden
  }, []);

  // Funktion zum Abrufen aller Suchaufträge vom Backend
  const fetchSearchAlerts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search_alerts`);
      const data = await response.json();
      if (response.ok) {
        setSearchAlerts(data);
      } else {
        // Handle server-side errors (e.g., 404, 500)
        showMessage(`Fehler beim Laden der Suchaufträge: ${data.message || response.statusText}`, 'error');
      }
    } catch (error) {
      // Handle network errors (e.g., 'Failed to fetch')
      console.error('Fehler beim Abrufen der Suchaufträge:', error);
      let errorMessage = `Netzwerkfehler: ${error.message}`;
      if (error.message === 'Failed to fetch') {
          errorMessage = 'Verbindung zum Backend fehlgeschlagen. Bitte stelle sicher, dass der Flask-Server läuft (http://127.0.0.1:3050).';
      }
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, showMessage]);

  // Effekt, um Suchaufträge beim Laden der Komponente abzurufen
  useEffect(() => {
    fetchSearchAlerts();
  }, [fetchSearchAlerts]);

  // Funktion zum Hinzufügen/Bearbeiten eines Suchauftrags
  const handleSubmit = async (e) => {
    e.preventDefault(); // Standard-Formular-Absenden verhindern
    setLoading(true);
    const method = editingAlertId ? 'PUT' : 'POST'; // PUT für Update, POST für Neu
    const url = editingAlertId ? `${API_BASE_URL}/update_search_alert/${editingAlertId}` : `${API_BASE_URL}/save_search`;

    const payload = {
      keywords: newKeywords.split(',').map(k => k.trim()).filter(k => k), // Keywords als Array
      location: newLocation,
      radius: newRadius,
      email: newEmail,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        showMessage(data.message, 'success');
        setNewKeywords('');
        setNewLocation('');
        setNewRadius(30);
        setNewEmail('');
        setEditingAlertId(null); // Bearbeitungsmodus beenden
        fetchSearchAlerts(); // Suchaufträge neu laden
      } else {
        showMessage(`Fehler: ${data.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Fehler beim Speichern/Aktualisieren des Suchauftrags:', error);
      let errorMessage = `Netzwerkfehler: ${error.message}`;
      if (error.message === 'Failed to fetch') {
          errorMessage = 'Verbindung zum Backend fehlgeschlagen. Bitte stelle sicher, dass der Flask-Server läuft (http://127.0.0.1:3050).';
      }
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Bearbeiten eines Suchauftrags (Formular mit Daten füllen)
  const handleEdit = (alert) => {
    setNewKeywords(alert.keywords.join(', '));
    setNewLocation(alert.location);
    setNewRadius(alert.radius);
    setNewEmail(alert.email);
    setEditingAlertId(alert._id); // ID des zu bearbeitenden Suchauftrags setzen
    showMessage(`Bearbeite Suchauftrag für ${alert.keywords.join(', ')}`, 'info');
  };

  // Funktion zum Abbrechen des Bearbeitens
  const handleCancelEdit = () => {
    setNewKeywords('');
    setNewLocation('');
    setNewRadius(30);
    setNewEmail('');
    setEditingAlertId(null);
    setMessage('');
    setMessageType('');
  };

  // Funktion zum Löschen eines Suchauftrags
  const handleDelete = async (alertId) => {
    setLoading(true);
    // Ersetze window.confirm durch eine benutzerdefinierte Modale (gemäß Anweisungen)
    if (window.confirm('Sind Sie sicher, dass Sie diesen Suchauftrag löschen möchten?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/delete_search_alert/${alertId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok) {
          showMessage(data.message, 'success');
          fetchSearchAlerts(); // Suchaufträge neu laden
        } else {
          showMessage(`Fehler: ${data.message || response.statusText}`, 'error');
        }
      } catch (error) {
        console.error('Fehler beim Löschen des Suchauftrags:', error);
        let errorMessage = `Netzwerkfehler: ${error.message}`;
        if (error.message === 'Failed to fetch') {
            errorMessage = 'Verbindung zum Backend fehlgeschlagen. Bitte stelle sicher, dass der Flask-Server läuft (http://127.0.0.1:3050).';
        }
        showMessage(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false); // Ladezustand zurücksetzen, wenn Löschen abgebrochen wurde
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-inter antialiased">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
          Job-Suchauftragsverwaltung
        </h1>

        {/* Nachrichtenbereich */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg text-white ${messageType === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {message}
          </div>
        )}

        {/* Formular zum Erstellen/Bearbeiten von Suchaufträgen */}
        <form onSubmit={handleSubmit} className="mb-10 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            {editingAlertId ? 'Suchauftrag bearbeiten' : 'Neuen Suchauftrag erstellen'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (Komma-getrennt):
              </label>
              <input
                type="text"
                id="keywords"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="z.B. Softwareentwickler, Python"
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Ort:
              </label>
              <input
                type="text"
                id="location"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="z.B. Berlin"
                required
              />
            </div>
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                Radius (in km):
              </label>
              <input
                type="number"
                id="radius"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={newRadius}
                onChange={(e) => setNewRadius(parseInt(e.target.value) || 0)}
                min="0"
                required
              />
            </div>
            <div className="md:col-span-2"> {/* Dieses div erstreckt sich über zwei Spalten */}
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail für Benachrichtigungen:
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ihre.email@example.com"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            {editingAlertId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow hover:bg-gray-400 transition duration-200"
                disabled={loading}
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Speichern...' : (editingAlertId ? 'Änderungen speichern' : 'Suchauftrag erstellen')}
            </button>
          </div>
        </form>

        {/* Liste der Suchaufträge */}
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Meine Suchaufträge</h2>
        {loading && searchAlerts.length === 0 ? (
          <p className="text-center text-gray-600">Suchaufträge werden geladen...</p>
        ) : searchAlerts.length === 0 ? (
          <p className="text-center text-gray-600">Noch keine Suchaufträge vorhanden.</p>
        ) : (
          <div className="space-y-4">
            {searchAlerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="flex-grow mb-4 md:mb-0">
                  <p className="text-lg font-semibold text-gray-800">
                    <span className="text-blue-600">Keywords:</span> {alert.keywords.join(', ')}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Ort:</span> {alert.location} ({alert.radius} km)
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">E-Mail:</span> {alert.email}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">ID: {alert._id}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(alert)}
                    className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow hover:bg-yellow-600 transition duration-200"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(alert._id)}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition duration-200"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
