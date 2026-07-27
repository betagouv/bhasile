import Link from "next/link";
import { ReactElement } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import {
  ActualisationStatus,
  DashboardStructureRow,
  InitialisationStatus,
} from "@/types/dashboard.type";

export const InitialisationActualisationRow = ({
  row,
}: Props): ReactElement => {
  const commune = buildCommuneLabel(
    row.communeAdministrative,
    row.departementAdministratif
  );

  return (
    <div className="col-span-full grid grid-cols-subgrid items-center text-default-grey whitespace-nowrap border-b border-default-grey py-3 px-6 text-sm [&:last-child]:border-none">
      <span className="font-bold">{row.codeBhasile}</span>
      <span>{row.type}</span>
      <span>{row.operateurName}</span>
      <span>{commune}</span>
      <span className="col-start-6 flex justify-center">
        <Badge type={statusBadgeType[row.initialisationStatus]}>
          {initialisationLabels[row.initialisationStatus]}
        </Badge>
      </span>
      <span className="flex justify-center">
        <Badge type={statusBadgeType[row.actualisationStatus]}>
          {actualisationLabels[row.actualisationStatus]}
        </Badge>
      </span>
      <span className="justify-self-end">
        {row.actionUrl && (
          <Link
            href={row.actionUrl}
            aria-label={`Actualiser ou finaliser ${row.codeBhasile ?? "la structure"}`}
          >
            <span className="fr-icon-arrow-right-line text-title-blue-france" />
          </Link>
        )}
      </span>
    </div>
  );
};

type Props = {
  row: DashboardStructureRow;
};

const initialisationLabels: Record<InitialisationStatus, string> = {
  A_INITIALISER: "À initialiser (opérateur)",
  A_FINALISER: "À finaliser (agent)",
  FINALISEE: "Finalisée",
};

const actualisationLabels: Record<ActualisationStatus, string> = {
  A_DEBUTER: "À débuter",
  EN_COURS: "En cours",
  FINALISEE: "Finalisée",
};

const statusBadgeType: Record<
  InitialisationStatus | ActualisationStatus,
  BadgeType
> = {
  A_INITIALISER: "warning",
  A_DEBUTER: "warning",
  A_FINALISER: "yellow",
  EN_COURS: "yellow",
  FINALISEE: "success",
};

const buildCommuneLabel = (
  commune: string | null,
  departement: string | null
): string | null => {
  if (!commune) {
    return null;
  }
  return departement ? `${commune} (${departement})` : commune;
};
