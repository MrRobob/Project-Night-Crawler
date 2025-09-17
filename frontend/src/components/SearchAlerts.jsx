import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/auth";

// Suchaufträge-Komponente
export default function SearchAlerts() {
  const [searchAlerts, setSearchAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // API-Endpunkt zum Abrufen der Suchaufträge
    apiFetch("/search_alerts")
      .then((res) => res.json())
      .then((data) => setSearchAlerts(data))
      .catch((err) =>
        console.error("Fehler beim Abrufen der Suchaufträge:", err),
      );
  }, []);

  const handleOpenAlert = (id) => {
    navigate(`/search_alert/${id}`);
  };

  const handleDeleteAlert = async (id, e) => {
    // Verhindert das Auslösen von handleOpenAlert
    if (e) e.stopPropagation();
    try {
      // API-Endpunkt zum Löschen eines Suchauftrags
      const res = await apiFetch(`/delete_search_alert/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      setSearchAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Fehler beim Löschen des Suchauftrags:", err);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4">
      <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
        <h2 className="text-lg font-medium text-graphite-100 mb-3">
          Suchaufträge
        </h2>

        {searchAlerts.length === 0 ? (
          <p className="text-graphite-400">Keine Suchaufträge gefunden.</p>
        ) : (
          <div className="grid gap-3">
            {searchAlerts.length === 0 ? (
              <div className="w-full min-h-[120px] flex items-center justify-center text-graphite-400">
                Keine Suchaufträge gefunden.
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full justify-items-stretch">
                {searchAlerts.map((alert) => (
                  <li
                    key={alert._id}
                    onClick={() => handleOpenAlert(alert._id)}
                    className="w-full cursor-pointer rounded-xl border border-graphite-800 bg-graphite-900/60 p-4 hover:bg-graphite-900 transition"
                  >
                    <div className="min-w-0">
                      {/* Zeile 1: Keywords */}
                      <div className="text-graphite-50 font-medium line-clamp-2 break-words">
                        {alert.keywords.join(", ")}
                      </div>

                      {/* Zeile 2: Unternehmen/Ort (hier „Location“) */}
                      <div className="text-sm text-graphite-300 mt-1">
                        {alert.location}
                      </div>

                      {/* Zeile 3: Details */}
                      <div className="text-sm text-graphite-400 mt-1">
                        Radius: {alert.radius} km
                        {alert.email ? <> · {alert.email}</> : null}
                      </div>
                    </div>

                    {/* Delete-Button (rechts unten) – stoppt das Öffnen */}
                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlert(alert._id, e);
                        }}
                        className="rounded-lg px-3 py-2 bg-transparent text-red-400 hover:text-red-300 border border-graphite-800"
                      >
                        Löschen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
