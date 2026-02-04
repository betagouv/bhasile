"use client";

import { useCpomsSearch } from "@/app/hooks/useCpomsSearch";
import { formatCpomName } from "@/app/utils/cpom.util";

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
            <a href={`/cpoms/${cpom.id}/modification/01-identification`}>
              {formatCpomName(cpom)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
