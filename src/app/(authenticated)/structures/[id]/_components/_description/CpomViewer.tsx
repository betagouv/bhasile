"use client";

import Link from "next/link";
import { ReactElement, useState } from "react";

import {
  getCurrentCpomStructures,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const CpomViewer = (): ReactElement => {
  const [showCpom, setShowCpom] = useState(false);

  const { structure } = useStructureContext();

  const isInCpom = structure.isInCpom;

  const currentCpomStructure = getCurrentCpomStructures(structure);

  return (
    <>
      <div className="col-span-2 flex gap-2 mb-3 items-center">
        <strong>CPOM</strong>
        <span>{isInCpom ? "Oui" : "Non"}</span>
        {isInCpom && (
          <button
            className={`fr-btn fr-btn--sm fr-btn--icon-left fr-btn--tertiary-no-outline py-0 ${
              showCpom ? "fr-icon-eye-off-line" : "fr-icon-eye-line"
            }`}
            onClick={() => setShowCpom(!showCpom)}
          >
            {showCpom ? "Masquer le détail" : "Voir le détail"}
          </button>
        )}
      </div>
      {showCpom && (
        <div className="col-span-2 text-mention-grey">
          {currentCpomStructure?.cpom?.structures?.map(
            (structure) =>
              structure.structure && (
                <div key={structure.id} className="flex gap-2 items-center">
                  <span className="flex gap-2 my-2">
                    <strong className="pr-3">
                      {structure.structure.codeBhasile}
                    </strong>
                    <span>{structure.structure.type}</span>{" "}
                    <span>{structure.structure.operateur?.name}</span>{" "}
                    <span>
                      {structure.structure.communeAdministrative}
                    </span>{" "}
                  </span>
                  {structure.structure.forms?.some((form) => form.status) && (
                    <Link
                      className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-s-line"
                      title="Voir la structure"
                      aria-label="Voir la structure"
                      href={`/structures/${structure.structure.id}`}
                    />
                  )}
                </div>
              )
          )}
        </div>
      )}
    </>
  );
};
