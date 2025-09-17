import React from "react";
export default function License() {
  return (
    <div className="mx-auto max-w-[900px] w-full px-4 md:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-graphite-100">Lizenz</h1>
      <p className="mt-4 text-graphite-300">
        Dieses Projekt steht unter der{" "}
        <strong>PolyForm Noncommercial License 1.0.0</strong>. Nutzung,
        Änderungen und Verteilung sind für <em>nicht-kommerzielle</em> Zwecke
        gestattet. Kommerzielle Nutzung ist untersagt. Volltext siehe{" "}
        <a
          className="underline"
          href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
        >
          polyformproject.org
        </a>
        .
      </p>
    </div>
  );
}
