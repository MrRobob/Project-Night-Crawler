import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import BookmarkedJobs from "./components/BookmarkedJobs";
import SearchForm from "./components/SearchForm";
import SearchAlerts from "./components/SearchAlerts";
import SearchResults from "./components/SearchResults";

function App() {
  const [jobs, setJobs] = useState([]); // Array zum Speichern der gefundenen Jobs

  useEffect(() => {
    fetch("http://localhost:3050/jobsuchen")
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((err) => console.error("Fehler beim Abrufen der Jobs:", err));
  }, []);

  const handleSearch = ({ keywords, location, radius }) => {
    return fetch("http://localhost:3050/jobsuchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, radius }),
    })
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
      })
      .catch((err) => {
        console.error("Fehler beim Abrufen der Jobs:", err);
      });
  };

  const handleBookmarkChange = (e, job) => {
    const updatedBookmarkStatus = e.target.checked;

    const updatedJobs = jobs.map((j) =>
      j._id === job._id ? { ...j, bookmark: updatedBookmarkStatus } : j,
    );
    setJobs(updatedJobs);

    fetch("http://localhost:3050/update_bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: job._id,
        bookmark: updatedBookmarkStatus,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          console.error(
            "Fehler beim Aktualisieren des Lesezeichens:",
            data.message,
          );
        }
      })
      .catch((err) => {
        console.error("Fehler beim Aktualisieren des Lesezeichens:", err);
      });
  };

  return (
    <Router>
      <div className="container">
        <h1>Job-Suche</h1> {/* <-- Sichtbare Überschrift */}
        <Routes>
          <Route
            path="/"
            element={
              <SearchForm
                onSearch={handleSearch}
                jobs={jobs}
                handleBookmarkChange={handleBookmarkChange}
              />
            }
          />
          <Route path="/bookmarked" element={<BookmarkedJobs />} />
          <Route path="/search_alerts" element={<SearchAlerts />} />
          <Route path="/search_results/:alertId" element={<SearchResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
