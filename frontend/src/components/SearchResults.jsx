import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../lib/auth";

export default function SearchResults() {
  const { alertId } = useParams();
  const [results, setResults] = useState([]);

  useEffect(() => {
    apiFetch(`/get_search_results/${alertId}`)
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((err) =>
        console.error("Fehler beim Abrufen der Suchergebnisse:", err),
      );
  }, [alertId]);

  return (
    <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4">
      <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-medium text-graphite-100">
            Suchergebnisse
          </h2>
        </div>

        {results.length === 0 ? (
          <p className="text-graphite-400">Keine Ergebnisse gefunden.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {results.map((result) => (
              <li
                key={result._id}
                className="w-full rounded-xl border border-graphite-800 bg-graphite-900/60 p-4 hover:bg-graphite-900 transition"
              >
                <div className="flex items-start gap-3">
                  {/* Text rechts – 3 Zeilen */}
                  <div className="min-w-0">
                    <div className="text-graphite-50 font-medium truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-graphite-300 mt-0.5">
                      {result.company} ({result.source})
                    </div>
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
                    >
                      Details
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
