import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";

export const StructureHeaderContent = ({
  title,
  codeBhasile,
  nom,
  type,
  operateurLabel,
  communeAdministrative,
  departementAdministratif,
}: Props): ReactElement => (
  <div>
    <h2 className="text-title-blue-france text-xs uppercase mb-0">
      <strong className="pr-3">{title}</strong>
    </h2>
    <h3 className="text-title-blue-france fr-h6 mb-0 flex items-center gap-4">
      <span className="flex items-center gap-2">
        <strong>{codeBhasile}</strong>
        {nom ? (
          <>
            –
            <span className="mb-0 text-title-grey text-lg italic font-normal text-ellipsis whitespace-nowrap overflow-hidden">
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

type Props = {
  title: string;
  codeBhasile?: string | null;
  nom?: string | null;
  type?: string | null;
  operateurLabel?: string | null;
  communeAdministrative?: string | null;
  departementAdministratif?: string | null;
};
