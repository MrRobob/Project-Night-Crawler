import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BookmarkedJobs from "./components/BookmarkedJobs";
import SearchForm from "./components/SearchForm";
import SearchAlerts from "./components/SearchAlerts";
import SearchResults from "./components/SearchResults";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import RequestReset from "./pages/RequestReset";
import ResetPassword from "./pages/ResetPassword";
import { apiFetch } from "./lib/auth";
import HeaderBar from "./components/HeaderBar";
import Landing from "./pages/Landing";
import FooterLegal from "./components/FooterLegal";
import Impressum from "./pages/Impressum";
import Kontakt from "./pages/Kontakt";
import Datenschutz from "./pages/Datenschutz";
import License from "./pages/License";
import Sidebar from "./components/Sidebar";

function App() {
  const [jobs, setJobs] = useState([]); // Array zum Speichern der gefundenen Jobs

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/jobsuchen");
      if (res.ok) setJobs(await res.json());
    })();
  }, []);

  const handleSearch = ({ keywords, location, radius }) =>
    apiFetch("/jobsuchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, radius }),
    }).then(async (res) => {
      if (res.ok) setJobs(await res.json());
    });

  const handleBookmarkChange = async (e, job) => {
    const updatedBookmarkStatus = e.target.checked;

    // UI sofort aktualisieren
    setJobs((prev) =>
      prev.map((j) =>
        j._id === job._id ? { ...j, bookmark: updatedBookmarkStatus } : j,
      ),
    );

    // Server-Update (JWT via apiFetch)
    const res = await apiFetch("/update_bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: job._id, bookmark: updatedBookmarkStatus }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(
        "Fehler beim Aktualisieren des Lesezeichens:",
        data?.message || res.status,
      );
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-graphite-950 text-graphite-100">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="*"
              element={
                <>
                  <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4">
                    <HeaderBar />
                  </div>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/request-reset" element={<RequestReset />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/impressum" element={<Impressum />} />
                    <Route path="/kontakt" element={<Kontakt />} />
                    <Route path="/datenschutz" element={<Datenschutz />} />
                    <Route path="/license" element={<License />} />
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                              <Sidebar />
                              <main className="grid gap-4">
                                <SearchForm
                                  onSearch={handleSearch}
                                  jobs={jobs}
                                  handleBookmarkChange={handleBookmarkChange}
                                  onResetUI={() => setJobs([])}
                                />
                              </main>
                            </div>
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookmarked"
                      element={
                        <ProtectedRoute>
                          <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                              <Sidebar />
                              <main className="grid gap-4">
                                <BookmarkedJobs />
                              </main>
                            </div>
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/search_alerts"
                      element={
                        <ProtectedRoute>
                          <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                              <Sidebar />
                              <main className="grid gap-4">
                                <SearchAlerts />
                              </main>
                            </div>
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/search_alert/:alertId"
                      element={
                        <ProtectedRoute>
                          <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                              <Sidebar />
                              <main className="grid gap-4">
                                <SearchResults />
                              </main>
                            </div>
                          </div>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </>
              }
            />
          </Routes>
          <div className="mx-auto max-w-[1400px] w-full px-3 md:px-6 lg:px-8 py-4 border-t border-gray-800">
            <FooterLegal />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
