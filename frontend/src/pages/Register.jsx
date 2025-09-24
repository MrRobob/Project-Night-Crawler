import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const r = await register(email, password);
    setMsg(
      r?.error ? r.error : "Registriert! Bitte E-Mail prüfen und verifizieren.",
    );
  };

  return (
    <div className="mx-auto max-w-[480px] mt-10 rounded-2xl border border-graphite-800 bg-graphite-900/60 p-6">
      <h1 className="text-xl text-graphite-100 mb-4">Registrieren!</h1>
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
        {msg && <div className="text-sm text-graphite-300">{msg}</div>}
        <button className="w-full h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
          Konto anlegen
        </button>
        <a className="text-sm text-graphite-300 hover:text-white" href="/login">
          Ich habe schon ein Konto
        </a>
      </form>
    </div>
  );
}
