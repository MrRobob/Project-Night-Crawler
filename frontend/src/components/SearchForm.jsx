import React, { useState } from "react";
import { apiFetch } from "../lib/auth";

export default function SearchForm({
  onSearch,
  jobs,
  handleBookmarkChange,
  onResetUI = () => {},
}) {
  const [keywords, setKeywords] = useState([]);
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("30");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Boolean für den Ladezustand

  const handleAddKeyword = () => {
    const keywordInput = document.getElementById("keyword");
    if (keywordInput.value.trim()) {
      setKeywords([...keywords, keywordInput.value.trim()]);
      keywordInput.value = "";
    }
  };

  const handleResetJobs = () =>
    apiFetch(`/reset_jobs`, { method: "POST" }).catch(console.error);

  const handleKeyDown = (e) => {
    const keywordInput = e.target;
    if (e.key === "Enter") {
      e.preventDefault();
      if (keywordInput.value.trim()) {
        setKeywords([...keywords, keywordInput.value.trim()]);
        keywordInput.value = "";
      }
    }
  };

  const handleRemoveKeyword = (index) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(updatedKeywords);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true); // Ladezustand aktivieren
    onSearch({ keywords, location, radius }).then(() => {
      setIsLoading(false);
    });
  };

  const handleSaveSearch = () => {
    if (!email.trim()) {
      alert(
        "Bitte geben Sie eine E-Mail-Adresse ein, um den Suchauftrag zu speichern.",
      );
      return;
    }

    apiFetch(`/save_search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, radius, email }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Suchauftrag gespeichert:", data);
      })
      .catch((err) => {
        console.error("Fehler beim Speichern des Suchauftrags:", err);
      });
  };

  return (
    <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4">
      <form onSubmit={handleSubmit}>
        <div className="relative rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
          <div className="grid gap-4">
            {/* Zeile 1: Suchbegriff (580) + Add-Button (160, rechtsbündig) */}
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,580px)_460px] items-center gap-3">
              <input
                type="text"
                id="keyword"
                placeholder="Neuen Suchbegriff eingeben"
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl bg-graphite-900/60 border border-graphite-800
                     text-graphite-100 placeholder:text-graphite-500 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="w-full md:w-[172px] h-10 justify-self-end rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                + Suchbegriff
              </button>
            </div>

            {/* Zeile 2: Keywords (links) + „Alle löschen“ (rechts) */}
            {keywords.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,580px)_460px] items-start gap-3">
                {/* Bubbles – gleiche Breite wie Zeile 1/3/4 */}
                <div className="max-w-[580px]">
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 rounded-full border border-graphite-700 bg-graphite-900/60 px-3 py-1 text-sm text-graphite-200"
                      >
                        {keyword}
                        <button
                          className="rounded-md px-2 py-0.5 bg-transparent text-red-400 hover:text-red-300 border border-graphite-800 transition"
                          onClick={() => handleRemoveKeyword(index)}
                          type="button"
                          title="Entfernen"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Neuer Button rechts – gleiche Größe wie die anderen */}
                <button
                  type="button"
                  onClick={() => {
                    setKeywords([]);
                    onResetUI();
                    handleResetJobs();
                  }}
                  className="w-full md:w-[172px] h-10 justify-self-start sm:justify-self-end rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Zeile 3: Standort+Radius (580, links) + Jobs finden (160, rechts) */}
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,580px)_460px] items-center gap-3">
              {/* Linke Gruppe: Standort (420) + Radius (160) */}
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,420px)_160px] items-center gap-3">
                <input
                  type="text"
                  id="location"
                  placeholder="Standort eingeben"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-xl bg-graphite-900/60 border border-graphite-800
                       text-graphite-100 placeholder:text-graphite-500 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <select
                  name="radius"
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full rounded-xl bg-graphite-900/60 border border-graphite-800
                       text-graphite-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              </div>

              {/* Rechts: Submit (rechtsbündig, einheitliche Größe) */}
              <button
                type="submit"
                className="w-full md:w-[172px] h-10 justify-self-end rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                Jobs finden
              </button>
            </div>

            {/* Zeile 4: E-Mail (580) + Speichern (160, rechtsbündig) */}
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,580px)_460px] items-start gap-3">
              <input
                type="email"
                placeholder="E-Mail-Adresse eingeben"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-graphite-900/60 border border-graphite-800
                     text-graphite-100 placeholder:text-graphite-500 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={!email.trim()}
                className="w-full md:w-[172px] h-10 justify-self-end rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                Suche speichern
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Ergebnisse / Loading */}
      {isLoading ? (
        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
          <span className="inline-block animate-pulse">…lädt</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
          <h2 className="text-lg font-medium text-graphite-100 mb-3">
            Gefundene Jobs:
          </h2>
          {jobs.length === 0 ? (
            <p className="text-graphite-400">Keine Ergebnisse gefunden.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {jobs.map((job, index) => {
                const checked = !!job.bookmark;
                return (
                  <li
                    key={index}
                    className="w-full rounded-xl border border-graphite-800 bg-graphite-900/60 p-4 hover:bg-graphite-900 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Stern links */}
                      <button
                        type="button"
                        aria-pressed={checked}
                        title={
                          checked
                            ? "Lesezeichen entfernen"
                            : "Lesezeichen speichern"
                        }
                        onClick={() =>
                          handleBookmarkChange(
                            { target: { checked: !checked } },
                            job,
                          )
                        }
                        className="shrink-0 rounded-lg p-2 border border-graphite-800 hover:bg-graphite-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        {checked ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-[#6366F1]"
                            aria-hidden="true"
                          >
                            <polygon
                              points="12,17.27 18.18,21 16.54,13.97 22,9.24 14.81,8.63 12,2 9.19,8.63 2,9.24 7.46,13.97 5.82,21"
                              fill="currentColor"
                            />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-graphite-100"
                            aria-hidden="true"
                          >
                            <polygon
                              points="12,17.27 18.18,21 16.54,13.97 22,9.24 14.81,8.63 12,2 9.19,8.63 2,9.24 7.46,13.97 5.82,21"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Text rechts – 3 Zeilen */}
                      <div className="min-w-0">
                        <div className="text-graphite-50 font-medium truncate">
                          {job.title}
                        </div>
                        <div className="text-sm text-graphite-300 mt-0.5">
                          {job.company}
                        </div>
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
                        >
                          Details
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
