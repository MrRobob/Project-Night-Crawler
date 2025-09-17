import React from "react";
export default function Impressum() {
  return (
    <div className="mx-auto max-w-[900px] w-full px-4 md:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-graphite-100">Impressum</h1>
      <p className="mt-4 text-graphite-300 text-sm">
        (Bitte Name, ladungsfähige Anschrift, E-Mail, ggf. Telefon,
        Vertretungsberechtigte, USt-ID/Registernummer eintragen.)
      </p>
      <div className="mt-6 space-y-2 text-graphite-200">
        <div>
          <strong>Diensteanbieter:</strong> [Name]
        </div>
        <div>
          <strong>Anschrift:</strong> [Straße, PLZ Ort, Land]
        </div>
        <div>
          <strong>Kontakt:</strong> [E-Mail] · [Telefon, optional]
        </div>
        <div>
          <strong>Inhaltlich verantwortlich (§ 18 MStV):</strong> [Name,
          Anschrift]
        </div>
        <div>
          <strong>USt-ID/Handelsregister (falls vorhanden):</strong> [Angaben]
        </div>
      </div>
    </div>
  );
}
