const API = import.meta.env.VITE_API_URL || "http://localhost:3050";

const r = (k) => localStorage.getItem(k) || "";
const w = (k, v) => localStorage.setItem(k, v);
const d = (k) => localStorage.removeItem(k);

// --- Mini-Helper: JWT exp lesen (ohne libs)
function parseExp(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
function isExpired(token) {
  const expMs = parseExp(token);
  return !expMs || Date.now() >= expMs;
}

// --- Auto-Logout: Timer bis zum Ablauf des Access-Tokens
let _logoutTimer = null;
function scheduleExpiryLogout(access) {
  if (_logoutTimer) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
  const expMs = parseExp(access);
  if (!expMs) return; // kein Timer, Backend fängt 401 ab
  const delay = Math.max(0, expMs - Date.now());
  _logoutTimer = setTimeout(() => {
    clearTokens();
    // Wunsch: immer von der Startseite starten
    window.location.href = "/";
  }, delay);
}

// --- Public API
export function setTokens({ access, refresh }) {
  if (access) {
    w("access", access);
    // (1) Auto-Logout für neues Access aktivieren
    scheduleExpiryLogout(access);
  }
  if (refresh) w("refresh", refresh);
}
export function clearTokens() {
  d("access");
  d("refresh");
  if (_logoutTimer) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
}

// Beim App-Start: falls Token vorhanden, Timer setzen (kein Redirect)
function initAutoLogoutOnLoad() {
  const access = r("access");
  if (access) {
    if (isExpired(access)) {
      clearTokens();
    } else {
      scheduleExpiryLogout(access);
    }
  }
}
// sofort ausführen (keine Seiteneffekte außer Timer/Clear)
initAutoLogoutOnLoad();

async function refreshAccess() {
  const refresh = r("refresh");
  if (!refresh) return null;
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens({ access: data.access }); // setzt auch den neuen Timer
  return data.access;
}

export async function apiFetch(path, options = {}) {
  const access = r("access");
  const headers = {
    ...(options.headers || {}),
    ...(options.body && !("Content-Type" in (options.headers || {}))
      ? { "Content-Type": "application/json" }
      : {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };
  const url = `${API}${path}`;
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && r("refresh")) {
    const newAcc = await refreshAccess();
    if (newAcc) {
      const headers2 = { ...headers, Authorization: `Bearer ${newAcc}` };
      res = await fetch(url, { ...options, headers: headers2 });
    }
  }

  // (2) Fallback: abgemeldet + zur Startseite (nicht /login)
  if (res.status === 401 || res.status === 403) {
    clearTokens();
    const here = window.location.pathname;
    // Nur umleiten, wenn wir NICHT bereits auf Landing oder Login sind
    if (here !== "/" && here !== "/login") {
      window.location.href = "/";
    }
    return res;
  }
  return res;
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function register(email, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { ok: res.ok, data: await res.json() };
}
