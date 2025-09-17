import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function NavButton({ to, children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = pathname === to;
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`w-full text-left rounded-lg px-3 py-2 border transition
        ${
          active
            ? "text-white border-graphite-700 bg-graphite-900"
            : "text-graphite-300 hover:bg-graphite-900 hover:text-white border-graphite-800"
        }`}
    >
      {children}
    </button>
  );
}

export default function Sidebar() {
  return (
    <aside className="mt-4 rounded-2xl border border-graphite-800 bg-graphite-900/60 p-4 md:p-6 md:sticky md:top-4 h-fit">
      <nav className="grid gap-4">
        <NavButton to="/app">Suche</NavButton>
        <NavButton to="/bookmarked">Lesezeichen</NavButton>
        <NavButton to="/search_alerts">Suchaufträge</NavButton>
      </nav>
    </aside>
  );
}
