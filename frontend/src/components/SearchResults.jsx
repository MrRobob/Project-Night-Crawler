import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function SearchResults() {
    const { alertId } = useParams();
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`http://localhost:3050/get_search_results/${alertId}`)
            .then((res) => res.json())
            .then((data) => setResults(data))
            .catch((err) => console.error("Fehler beim Abrufen der Suchergebnisse:", err));
    }, [alertId]);

    return (
        <div className="container">
            <h2>Suchergebnisse</h2>
            <button onClick={() => navigate("/search_alerts")}>Zurück zu Suchaufträgen</button>
            {results.length === 0 ? (
                <p>Keine Ergebnisse gefunden.</p>
            ) : (
                <ul>
                    {results.map((result) => (
                        <li key={result._id}>
                            <strong>{result.title}</strong> bei {result.company} ({result.source})–{" "}
                            <a href={result.link} target="_blank" rel="noopener noreferrer">
                                Details
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchResults;