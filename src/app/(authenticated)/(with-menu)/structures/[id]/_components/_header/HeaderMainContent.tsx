import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { useStructureContext } from "@/contexts/StructureContext";

export const HeaderMainContent = (): ReactElement => {
  const { structure } = useStructureContext();

  const {
    codeBhasile,
    type,
    operateurLabel,
    nom,
    communeAdministrative,
    departementAdministratif,
  } = structure;

  return (
    <div>
      <h2 className="text-title-blue-france text-xs uppercase mb-0">
        <strong className="pr-3">Structure hébergement</strong>
      </h2>
      <h3 className="text-title-blue-france fr-h6 mb-0 flex items-center gap-4">
        <span className="flex items-center gap-2">
          <strong>{codeBhasile}</strong>
          {nom ? (
            <>
              –
              <span className="mb-0 text-title-grey text-lg italic font-normal">
                {nom}
              </span>
            </>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <Badge type="purple">{type}</Badge>{" "}
          <Badge type="purple">{operateurLabel}</Badge>{" "}
          <Badge type="purple">
            {communeAdministrative} ({departementAdministratif})
          </Badge>
        </span>
      </h3>
    </div>
  );
};
