import React from "react";

export default function Landing() {
  return (
    <div className="mx-auto max-w-[1100px] w-full px-4 md:px-6 lg:px-8 py-14">
      {/* Hero */}
      <section className="text-center">
        {/* neues Inline-SVG Logo zentriert */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1060 240"
          className="h-28 md:h-36 w-auto mx-auto mb-6"
          aria-label="Night Crawler – Hero"
        >
          <defs>
            <linearGradient id="nc-accent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            {/* Sichel-Maske: Weiß sichtbar, Schwarz schneidet aus.
            r=58 liegt direkt an der Glasinnenkante (Ring r=60, stroke=5) */}
            <mask id="nc-crescent-hero">
              <rect width="980" height="240" fill="black" />
              <circle cx="90" cy="90" r="58" fill="white" />
              <circle cx="106" cy="74" r="52" fill="black" />
            </mask>
          </defs>

          {/* Lupe */}
          <g transform="translate(88,-28)">
            {/* Ring */}
            <circle
              cx="90"
              cy="90"
              r="60"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="5"
            />
            {/* Glas mit Sichel (Gradient) */}
            <rect
              x="32"
              y="32"
              width="116"
              height="116"
              fill="url(#nc-accent)"
              mask="url(#nc-crescent-hero)"
            />
            {/* Griff: echtes Rechteck, rund, außerhalb des Glases */}

            <path
              d="M49,135 L8,176"
              stroke="#E5E7EB"
              strokeWidth="20"
              strokeLinecap="butt"
              fill="none"
            />

            <path
              d="M8,176 L0,184"
              stroke="#E5E7EB"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />

            {/* Krater: auf der hellen Sichel (rechte/untere Seite) */}
            <g fill="#E5E7EB" opacity="0.65">
              <circle cx="42" cy="75" r="6" />
              <circle cx="45" cy="100" r="4" />
              <circle cx="60" cy="120" r="6" />
              <circle cx="80" cy="130" r="4" />
              <circle cx="45" cy="115" r="3" />
            </g>
          </g>

          {/* Schriftzug – beide Wörter im Header-Gradient, kein Weiß */}
          <g transform="translate(120,22)">
            <text
              x="140"
              y="78"
              fontSize="90"
              fontWeight="800"
              fill="url(#nc-accent)"
              fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            >
              NIGHT
            </text>
            <text
              x="0"
              y="188"
              fontSize="90"
              fontWeight="800"
              fill="url(#nc-accent)"
              fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            >
              CRAWLER
            </text>
          </g>

          {/* Badge – größer, näher dran, keine Text-Überlappung */}
          <g transform="translate(600,38)">
            <rect
              width="375"
              height="170"
              rx="14"
              ry="14"
              fill="url(#nc-accent)"
              stroke="#E5E7EB"
              strokeWidth="4"
            />
            <text
              x="20"
              y="50"
              fontSize="46"
              fontWeight="800"
              fill="#FFFFFF"
              fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            >
              Search.
            </text>
            <text
              x="20"
              y="100"
              fontSize="46"
              fontWeight="800"
              fill="#FFFFFF"
              fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            >
              Save.
            </text>
            <text
              x="20"
              y="150"
              fontSize="46"
              fontWeight="800"
              fill="#FFFFFF"
              fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            >
              Stay Updated.
            </text>
          </g>
        </svg>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/register"
            className="px-5 h-11 inline-flex items-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            Jetzt starten
          </a>
          <a
            href="/app"
            className="px-5 h-11 inline-flex items-center rounded-lg border border-graphite-800 hover:bg-graphite-900 transition"
          >
            Zur App
          </a>
        </div>
      </section>

      {/* Kurz-Vorteile */}
      <section className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-5">
          <h3 className="text-graphite-100 font-medium">Schneller suchen</h3>
          <p className="text-graphite-400 mt-1 text-sm">
            Suchbegriffe, Ort & Radius – fokussiert statt überladen.
          </p>
        </div>
        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-5">
          <h3 className="text-graphite-100 font-medium">
            Merken mit nur einem Klick
          </h3>
          <p className="text-graphite-400 mt-1 text-sm">
            Lesezeichen - für deine Favoriten.
          </p>
        </div>
        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/60 p-5">
          <h3 className="text-graphite-100 font-medium">Immer aktuell</h3>
          <p className="text-graphite-400 mt-1 text-sm">
            Suchaufträge liefern Updates – direkt in dein Postfach.
          </p>
        </div>
      </section>
    </div>
  );
}
