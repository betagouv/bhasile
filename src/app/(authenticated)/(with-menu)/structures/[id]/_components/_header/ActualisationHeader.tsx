import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";
import { StructureCallToActionHeader } from "./StructureCallToActionHeader";

export const ActualisationHeader = ({
  actualisationYear,
}: {
  actualisationYear: number;
}): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <StructureCallToActionHeader
      href={`/structures/${structure.id}/actualisation/${actualisationYear}`}
      label="J’actualise cette structure"
      message={
        <>
          <strong>
            La campagne d’actualisation {actualisationYear} est ouverte :
          </strong>{" "}
          vous pouvez maintenant mettre à jour les données de la structure.
        </>
      }
    />
  );
};
