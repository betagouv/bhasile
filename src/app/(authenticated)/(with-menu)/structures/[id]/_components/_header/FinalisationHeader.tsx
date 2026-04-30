import Link from "next/link";
import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";

export const FinalisationHeader = (): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <div className="bg-alt-blue-france flex border-b border-b-border-default-grey px-6 py-4 items-center">
      <p className="m-0 pr-10 text-sm">
        L’outil est en phase d’initialisation : les pages des structures
        d’hébergement ont été pré-remplies par leurs opérateurs mais{" "}
        <strong>
          c’est aux DDETS et DREETS de les compléter pour finaliser la création
          des structures.
        </strong>
      </p>
      <Link
        href={`/structures/${structure.id}/finalisation/01-identification`}
        className="whitespace-nowrap h-full fr-btn"
      >
        Je finalise la création de cette structure
        <span className="pl-2 fr-icon-arrow-right-line fr-icon--sm" />
      </Link>
    </div>
  );
};
