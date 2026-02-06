"use client";

import { ReactElement } from "react";

export const CpomAjoutHeader = (): ReactElement | null => {
  return (
    <div className="sticky top-0 z-2 bg-lifted-grey">
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">Ajouter un CPOM</strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">Nouveau CPOM</strong>
          </h3>
        </div>
      </div>
    </div>
  );
};
