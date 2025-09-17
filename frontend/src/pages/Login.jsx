import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState(localStorage.getItem("auth_email") || "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const r = await login(email, password);
    if (r?.error) setErr(r.error);
    else window.location.href = "/app";
  };

  return (
    <div className="mx-auto max-w-[480px] mt-10 rounded-2xl border border-graphite-800 bg-graphite-900/60 p-6">
      <h1 className="text-xl text-graphite-100 mb-4">Login</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input
          className="rounded-xl bg-graphite-900/60 border border-graphite-800 px-3 py-2 text-graphite-100"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-xl bg-graphite-900/60 border border-graphite-800 px-3 py-2 text-graphite-100"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="w-full h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
          Einloggen
        </button>
        <a
          className="text-sm text-graphite-300 hover:text-white"
          href="/register"
        >
          Noch kein Account? Registrieren
        </a>
        <a
          className="text-sm text-graphite-300 hover:text-white"
          href="/request-reset"
        >
          Passwort vergessen?
        </a>
      </form>
    </div>
  );
}
