// frontend/src/components/SearchForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchForm({ onSearch, jobs, handleBookmarkChange }) {
  const [keywords, setKeywords] = useState([]);
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("30");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Neue State-Variable für Validierungsfehler
  const [errors, setErrors] = useState({});

  const handleAddKeyword = () => {
    const keywordInput = document.getElementById("keyword");
    const keywordValue = keywordInput.value.trim(); // Trimmen, um Leerzeichen zu entfernen
    if (keywordValue) { // Nur hinzufügen, wenn nicht leer
      setKeywords([...keywords, keywordValue]);
      keywordInput.value = ""; // Input leeren
      // Fehler zurücksetzen, wenn ein valides Keyword hinzugefügt wird
      if (errors.keywords) {
        setErrors({ ...errors, keywords: '' }); // Fehler für Keywords zurücksetzen
      }
    }
  };

  // Korrigierte handleKeyPress Funktion
  const handleKeyPress = (e) => {
    const keywordInput = e.target;
    if (e.key === "Enter") {
      e.preventDefault(); // Verhindert, dass die Seite neu geladen wird
      const keywordValue = keywordInput.value.trim();
      if (keywordValue) {
        setKeywords([...keywords, keywordValue]);
        keywordInput.value = ""; // Input leeren
        if (errors.keywords) {
          setErrors({ ...errors, keywords: '' }); // Fehler zurücksetzen
        }
      }
    }
  };

  // Korrigierte handleRemoveKeyword Funktion
  const handleRemoveKeyword = (index) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(updatedKeywords);
    // Wenn die letzte Keyword entfernt wurde und es vorher einen Fehler gab, könnten wir ihn hier zurücksetzen
    if (errors.keywords && updatedKeywords.length === 0) {
      setErrors({ ...errors, keywords: '' }); // Fehler zurücksetzen, wenn keine Keywords mehr vorhanden sind
    }
  };


  // Funktion zur Validierung der E-Mail
  const validateEmail = (emailValue) => {
    // Einfache Regex für E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Hier die Validierung für das Formular hinzufügen
    const newErrors = {};
    if (keywords.length === 0) {
      newErrors.keywords = "Mindestens ein Suchbegriff ist erforderlich.";
    }
    if (!location.trim()) {
      newErrors.location = "Der Standort darf nicht leer sein.";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }

    if (Object.keys(newErrors).length === 0) {
      // Wenn keine Fehler vorhanden sind, Suche starten
      setIsLoading(true); // Ladezustand aktivieren
      onSearch({ keywords, location, radius }).then(() => {
        setIsLoading(false);
      });
    } else {
      // Fehler anzeigen
      setErrors(newErrors);
    }
  };

  const handleSaveSearch = () => {
    const newErrors = {};
    if (keywords.length === 0) {
      newErrors.keywords = "Mindestens ein Suchbegriff ist erforderlich.";
    }
    if (!location.trim()) {
      newErrors.location = "Der Standort darf nicht leer sein.";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }

    if (Object.keys(newErrors).length === 0) {
      // Wenn keine Fehler vorhanden sind, Suchauftrag speichern
      fetch("http://localhost:3050/save_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location, radius, email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("Suchauftrag erfolgreich gespeichert:", data.search_alert);
            alert("Suchauftrag erfolgreich gespeichert!");
            // Optional: Formular zurücksetzen nach erfolgreichem Speichern
            setKeywords([]);
            setLocation('');
            setRadius('30');
            setEmail('');
            setErrors({}); // Fehler zurücksetzen
          } else {
            console.error("Fehler beim Speichern des Suchauftrags:", data.message || data.error);
            // Hier könnten Sie spezifischere Fehlermeldungen anzeigen
          }
        })
        .catch((err) => {
          console.error("Fehler beim Speichern des Suchauftrags:", err);
          alert("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
        });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="container">
      <h1>IT ist Zukunft, IT ist alles!</h1>

      <form onSubmit={handleSubmit}>
        <div className="keyword-section">
          <input
            type="text"
            id="keyword"
            placeholder="Neuen Suchbegriff eingeben"
            onKeyPress={handleKeyPress}
          />
          <button type="button" onClick={handleAddKeyword}>
            Suchbegriff hinzufügen
          </button>
        </div>

        <div className="keyword-bubbles">
          {keywords.map((keyword, index) => (
            <span key={index} className="bubble">
              {keyword}
              <button
                className="remove-button"
                onClick={() => handleRemoveKeyword(index)}
                type="button" // Wichtig, damit es nicht das Formular absendet
              >
                x
              </button>
            </span>
          ))}
        </div>
        {/* Fehleranzeige für Keywords */}
        {errors.keywords && <p className="error-message">{errors.keywords}</p>}

        <input
          type="text"
          id="location"
          placeholder="Standort eingeben"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            if (errors.location) setErrors({...errors, location: ''}); // Fehler zurücksetzen, wenn Benutzer tippt
          }}
          required // Das `required` ist für die HTML5-Validierung, aber wir haben auch JS-Validierung
        />
        {errors.location && <p className="error-message">{errors.location}</p>}

        <select
          name="radius"
          id="radius"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        >
          <option value="5">5km</option>
          <option value="10">10km</option>
          <option value="20">20km</option>
          <option value="30">30km</option>
          <option value="40">40km</option>
          <option value="50">50km</option>
          <option value="75">75km</option>
          <option value="100">100km</option>
        </select>

        <button type="submit" disabled={isLoading || keywords.length === 0 || !location.trim() || !validateEmail(email)}>
          {isLoading ? "Lädt..." : "Jobs finden"}
        </button>

        <input
          type="email"
          placeholder="E-Mail-Adresse eingeben"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({...errors, email: ''}); // Fehler zurücksetzen, wenn Benutzer tippt
          }}
        />
        {errors.email && <p className="error-message">{errors.email}</p>}

        {/* Button wird deaktiviert, wenn keine E-Mail vorhanden ist oder wenn Fehler vorliegen */}
        <button
          type="button"
          onClick={handleSaveSearch}
          disabled={!email.trim() || keywords.length === 0 || !location.trim() || !validateEmail(email)}
        >
          Suchauftrag speichern
        </button>
      </form>

      <div>
        <button type="button" onClick={() => navigate("/bookmarked")}>
          Gespeicherte Lesezeichen
        </button>
        <button type="button" onClick={() => navigate("/search_alerts")}>
          Gespeicherte Suchaufträge
        </button>
      </div>

      {isLoading ? (
        <div className="spinner">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      ) : (
        <div className="results">
          <h2>Gefundene Jobs:</h2>
          {jobs.length === 0 ? (
            <p>Keine Ergebnisse gefunden.</p>
          ) : (
            <ul>
              {jobs.map((job, index) => (
                <li key={index}>
                  <strong>{job.title}</strong> bei {job.company} –{" "}
                  <a href={job.link} target="_blank" rel="noopener noreferrer">
                    Details
                  </a>
                  <label>
                    <input
                      type="checkbox"
                      checked={job.bookmark}
                      onChange={(e) => handleBookmarkChange(e, job)}
                    />
                    {job.bookmark ? "Entfernen" : "Speichern"}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchForm;