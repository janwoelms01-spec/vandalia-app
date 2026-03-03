"use client";

import { useState, useEffect } from "react";

type ModalType = "impressum" | "datenschutz" | null;

export default function FooterLegal() {
  const [open, setOpen] = useState<ModalType>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
     <footer className="w-full border-t border-gray-200 mt-6">
  <div className="max-w-6xl mx-auto py-3 text-xs text-gray-500 flex justify-center gap-6">
    <button
      onClick={() => setOpen("impressum")}
      className="hover:text-gray-800 transition-colors"
    >
      Impressum
    </button>

    <button
      onClick={() => setOpen("datenschutz")}
      className="hover:text-gray-800 transition-colors"
    >
      Datenschutz
    </button>
  </div>
</footer>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-xl p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute top-4 right-6 text-gray-500 hover:text-black text-xl"
            >
              ×
            </button>

            {open === "impressum" && <Impressum />}
            {open === "datenschutz" && <Datenschutz />}
          </div>
        </div>
      )}
    </>
  );
}

function Impressum() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">Impressum</h2>

      <p className="mb-4">
        Angaben gemäß § 5 TMG
      </p>

      <p className="mb-4">
        Jan Wölms <br />
        Schumannstraße 7 <br />
        53113 Bonn <br />
        Deutschland
      </p>

      <p className="mb-4">
        Kontakt: <br />
        E-Mail: janwoelms01@gmail.com
      </p>

      <p>
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: <br />
        Jan Wölms, Anschrift wie oben
      </p>
    </>
  );
}

function Datenschutz() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">Datenschutzerklärung</h2>

      <h3 className="font-semibold mt-4 mb-2">1. Verantwortlicher</h3>
      <p className="mb-4">
        Jan Wölms <br />
        Schumannstraße 7 <br />
        53113 Bonn <br />
        E-Mail: janwoelms01@gmail.com
      </p>

      <h3 className="font-semibold mt-4 mb-2">2. Hosting</h3>
      <p className="mb-4">
        Diese Website wird auf Servern der Hetzner Online GmbH,
        Industriestr. 25, 91710 Gunzenhausen, Deutschland gehostet.
        Mit Hetzner besteht ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO.
      </p>

      <p className="mb-4">
        Die Domain wird über die IONOS SE,
        Elgendorfer Str. 57, 56410 Montabaur, Deutschland verwaltet.
      </p>

      <h3 className="font-semibold mt-4 mb-2">3. Server-Logfiles</h3>
      <p className="mb-4">
        Beim Aufruf der Website werden automatisch folgende Daten erhoben:
        IP-Adresse, Datum und Uhrzeit, aufgerufene Seite,
        Browsertyp und Betriebssystem.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h3 className="font-semibold mt-4 mb-2">4. Benutzerkonto</h3>
      <p className="mb-4">
        Zur Nutzung des Mitgliederbereichs werden Name,
        E-Mail-Adresse, Mitgliedsstatus und Funktionsdaten verarbeitet.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO sowie Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <p className="mb-4">
        Passwörter werden nicht im Klartext gespeichert,
        sondern mittels kryptographischem Hashverfahren gesichert.
      </p>

      <h3 className="font-semibold mt-4 mb-2">5. Externe Schnittstellen</h3>
      <p className="mb-4">
        Zur automatischen ISBN-Erkennung werden Open Library
        und die Google Books API verwendet.
        Dabei kann technisch eine Übermittlung der IP-Adresse erfolgen.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h3 className="font-semibold mt-4 mb-2">6. Speicherdauer</h3>
      <p className="mb-4">
        Personenbezogene Daten werden gelöscht,
        sobald der Zweck der Speicherung entfällt
        oder gesetzliche Aufbewahrungsfristen abgelaufen sind.
      </p>

      <h3 className="font-semibold mt-4 mb-2">7. Betroffenenrechte</h3>
      <p>
        Es bestehen Rechte auf Auskunft, Berichtigung, Löschung,
        Einschränkung der Verarbeitung, Datenübertragbarkeit
        und Widerspruch gemäß DSGVO.
        Zudem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.
      </p>
    </>
  );
}