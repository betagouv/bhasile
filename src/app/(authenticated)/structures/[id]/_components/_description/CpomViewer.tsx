"use client";

import Link from "next/link";
import { ReactElement, useState } from "react";

import {
  getCurrentCpomStructures,
  isStructureInCpom,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const CpomViewer = (): ReactElement => {
  const [showCpom, setShowCpom] = useState(false);

  const { structure } = useStructureContext();

  const isInCpom = isStructureInCpom(structure);

  const currentCpomStructure = getCurrentCpomStructures(structure);

  return (
    <>
      <div className="flex items-center">
        <strong className="pr-3">CPOM</strong>
        <span className="pr-2">{isInCpom ? "Oui" : "Non"}</span>
        <button
          className={`fr-btn fr-btn--sm fr-btn--icon-left fr-btn--tertiary-no-outline ${
            showCpom ? "fr-icon-eye-off-line" : "fr-icon-eye-line"
          }`}
          onClick={() => setShowCpom(!showCpom)}
        >
          {showCpom ? "Masquer le détail" : "Voir le détail"}
        </button>
      </div>
      {showCpom && (
        <div className="text-mention-grey">
          {currentCpomStructure?.cpom?.structures?.map((structure) => (
            <div key={structure.id} className="flex items-center">
              <span className="flex gap-2 my-2">
                <strong className="pr-3">{structure.structure?.dnaCode}</strong>
                <span>{structure.structure?.type}</span>{" "}
                <span>{structure.structure?.operateur?.name}</span>{" "}
                <span>{structure.structure?.communeAdministrative}</span>{" "}
              </span>
              {structure.structure?.forms?.some((form) => form.status) && (
                <Link
                  className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-s-line"
                  title="Voir la structure"
                  href={`/structures/${structure.structure?.id}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
