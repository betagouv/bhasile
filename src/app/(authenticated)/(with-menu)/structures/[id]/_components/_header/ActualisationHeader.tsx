import { ReactElement } from "react";

import { CallToActionBanner } from "@/components/CallToActionBanner";
import { useStructureContext } from "@/contexts/StructureContext";

export const ActualisationHeader = ({
  actualisationYear,
}: {
  actualisationYear: number;
}): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <CallToActionBanner
      href={`/structures/${structure.id}/actualisation/${actualisationYear}/01-places`}
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
