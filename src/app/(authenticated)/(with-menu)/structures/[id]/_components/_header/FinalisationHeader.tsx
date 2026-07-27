import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";
import { StructureCallToActionHeader } from "./StructureCallToActionHeader";

export const FinalisationHeader = (): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <StructureCallToActionHeader
      href={`/structures/${structure.id}/finalisation/01-identification`}
      label="Je finalise la création de cette structure"
      message={
        <>
          L’outil est en phase d’initialisation : les pages des structures
          d’hébergement ont été pré-remplies par leurs opérateurs mais{" "}
          <strong>
            c’est aux DDETS et DREETS de les compléter pour finaliser la
            création des structures.
          </strong>
        </>
      }
    />
  );
};
