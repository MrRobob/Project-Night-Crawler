import React from "react";
export default function Datenschutz() {
  return (
    <div className="mx-auto max-w-[900px] w-full px-4 md:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-graphite-100">Datenschutz</h1>
      <p className="mt-4 text-graphite-300 text-sm">
        Kurzfassung: Wir verarbeiten Login-Daten (E-Mail/Passwort-Hash), Tokens
        (JWT im Storage) und optionale E-Mail-Adressen für Suchaufträge. Keine
        Weitergabe an Dritte. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Nutzerkonto) und ggf. lit. a (E-Mail-Alerts). Speicherdauer: bis zur
        Löschung des Kontos/Suchauftrags. Hosting lokal (Dev), später ggf.
        Cloud.
      </p>
    </div>
  );
}
