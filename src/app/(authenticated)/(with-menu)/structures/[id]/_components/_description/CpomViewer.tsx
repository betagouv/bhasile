"use client";

import Link from "next/link";
import { ReactElement, useState } from "react";

import {
  useCanReadStructures,
  useCanUpdateStructures,
} from "@/app/hooks/useCanUpdateStructure";
import { getCurrentCpomStructure } from "@/app/utils/structure.util";
import { useStructureContext } from "@/contexts/StructureContext";
import { getCpomStructureLink } from "@/utils/structure-link.util";

export const CpomViewer = (): ReactElement => {
  const [showCpom, setShowCpom] = useState(false);

  const { structure } = useStructureContext();
  const canReadStructure = useCanReadStructures();
  const canUpdateStructure = useCanUpdateStructures();

  const currentCpomStructure = getCurrentCpomStructure(structure);

  return (
    <>
      <div className="col-span-2 flex gap-2 mb-3 items-center">
        <strong>CPOM</strong>
        <span>{structure.isInCpom ? "Oui" : "Non"}</span>
        {structure.isInCpom && (
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
          {currentCpomStructure?.cpom?.structures?.map((structure) => {
            if (!structure.structure) {
              return null;
            }
            const link = getCpomStructureLink(structure.structure, {
              canReadStructure,
              canUpdateStructure,
            });
            return (
              <div key={structure.id} className="flex gap-2 items-center">
                <span className="flex gap-2 my-2">
                  <strong className="pr-3">
                    {structure.structure.codeBhasile}
                  </strong>
                  <span>{structure.structure.type}</span>{" "}
                  <span>{structure.structure.operateur?.name}</span>{" "}
                  <span>{structure.structure.communeAdministrative}</span>{" "}
                </span>
                {link && (
                  <Link
                    className={`fr-btn fr-btn--tertiary-no-outline ${link.isFinalisation ? "fr-icon-edit-line" : "fr-icon-arrow-right-s-line"}`}
                    title={link.title}
                    aria-label={link.title}
                    href={link.href}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
