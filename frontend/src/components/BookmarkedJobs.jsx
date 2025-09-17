import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";

export default function BookmarkedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/bookmarked_jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Fehler beim Laden der Lesezeichen.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const removeBookmark = async (jobId) => {
    try {
      const res = await apiFetch("/update_bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: jobId, bookmark: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Fehler");
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (e) {
      console.error(e);
      setErr("Konnte Lesezeichen nicht entfernen.");
    }
  };

  if (loading)
    return <div className="text-graphite-300">Lade Lesezeichen…</div>;
  if (err) return <div className="text-red-400">{err}</div>;

  return (
    <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4">
      <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6">
        <h2 className="text-lg font-medium text-graphite-100 mb-3">
          Lesezeichen
        </h2>

        {jobs.length === 0 ? (
          <p className="text-graphite-400">Keine gebookmarkten Jobs.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {jobs.map((job) => (
              <li
                key={job._id}
                className="w-full rounded-xl border border-graphite-800 bg-graphite-900/60 p-4 hover:bg-graphite-900 transition"
              >
                <div className="flex items-start gap-3">
                  {/* Stern links – immer aktiv; Klick entfernt Bookmark */}
                  <button
                    type="button"
                    aria-pressed={true}
                    title="Lesezeichen entfernen"
                    onClick={() => removeBookmark(job._id)}
                    className="shrink-0 rounded-lg p-2 border border-graphite-800 hover:bg-graphite-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
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
                  </button>

                  {/* Text rechts – 3 Zeilen */}
                  <div className="min-w-0">
                    <div className="text-graphite-50 font-medium truncate">
                      {job.title}
                    </div>
                    <div className="text-sm text-graphite-300 mt-0.5">
                      {job.company} ({job.source})
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
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
