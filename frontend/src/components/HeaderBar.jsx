// src/components/HeaderBar.jsx
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";

export default function HeaderBar() {
  const { loggedIn, email, logout } = useAuth();

  return (
    <header className="flex items-center gap-2">
      <Link to="/">
        <svg
          className="h-8 w-auto"
          viewBox="0 0 320 64"
          fill="none"
          role="img"
          aria-label="Night Crawler"
        >
          <defs>
            <linearGradient id="nc-accent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <mask id="nc-crescent">
              <rect width="64" height="64" fill="black" />
              <circle cx="28" cy="28" r="14" fill="white" />
              <circle cx="34" cy="24" r="13" fill="black" />
            </mask>
          </defs>

          {/* Lupe links – Griff nach links unten */}
          <circle
            cx="28"
            cy="28"
            r="14"
            stroke="#E5E7EB"
            strokeWidth="2"
            fill="none"
          />
          <rect
            width="64"
            height="64"
            fill="url(#nc-accent)"
            mask="url(#nc-crescent)"
          />
          <line
            x1="16"
            y1="40"
            x2="9.5"
            y2="46.5"
            stroke="#E5E7EB"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Schriftzug rechts – eine Zeile, gleiche Größe */}
          <text
            x="55"
            y="40"
            fontSize="30"
            fontWeight="800"
            fill="url(#nc-accent)"
            fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
          >
            NIGHT CRAWLER
          </text>
        </svg>
      </Link>

      {/* Rechts: nur wenn eingeloggt */}
      <div className="ml-auto flex items-center gap-3">
        {loggedIn ? (
          <>
            <span className="text-sm text-graphite-300">{email}</span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
