"use client";

import { useCpomsSearch } from "@/app/hooks/useCpomsSearch";

export default function CpomPage() {
  const { cpoms } = useCpomsSearch();

  if (!cpoms) {
    return null;
  }

  return (
    <div>
      <h1>CPOM</h1>
      <ul>
        {cpoms.map((cpom) => (
          <li key={cpom.id}>
            <a href={`/cpom/${cpom.id}/modification/01-identification`}>
              {cpom.name ||
                `${cpom.operateur?.name} - ${cpom.region} (${cpom.departements?.join(", ")})`}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
