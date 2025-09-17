import React from "react";

export default function FooterLegal() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-graphite-800">
      <div className="mx-auto max-w-[1100px] w-full px-4 md:px-6 lg:px-8 py-6">
        <div className="text-sm text-graphite-400">
          Project Night Crawler · Full-Stack Job-Crawler (React/Vite · Flask ·
          MongoDB) – Studentenprojekt.
        </div>
        <div className="mt-2 text-sm text-graphite-400">
          Lizenz:{" "}
          <a className="underline hover:text-white" href="/license">
            PolyForm Noncommercial 1.0.0
          </a>
        </div>
        <nav className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <a className="text-graphite-300 hover:text-white" href="/impressum">
            Impressum
          </a>
          <a className="text-graphite-300 hover:text-white" href="/kontakt">
            Kontakt
          </a>
          <a className="text-graphite-300 hover:text-white" href="/datenschutz">
            Datenschutz
          </a>
        </nav>
        <div className="mt-3 text-xs text-graphite-500">
          © {year} Night Crawler
        </div>
      </div>
    </footer>
  );
}
