import React from "react";
export default function Kontakt() {
  return (
    <div className="mx-auto max-w-[900px] w-full px-4 md:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-graphite-100">Kontakt</h1>
      <p className="mt-4 text-graphite-300">
        Schreib uns per E-Mail:{" "}
        <a href="mailto:[deine-mail]@[domain]" className="underline">
          [deine-mail]@[domain]
        </a>
      </p>
      {/* Optional: kleines Formular später */}
    </div>
  );
}
