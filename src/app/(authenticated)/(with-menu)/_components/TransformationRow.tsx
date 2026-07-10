import Link from "next/link";
import { ReactElement } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { formatDate } from "@/app/utils/date.util";
import { DEPARTEMENTS } from "@/constants";
import {
  DashboardTransformationRow,
  DashboardTransformationStatus,
} from "@/types/dashboard.type";

export const TransformationRow = ({ row }: Props): ReactElement => {
  const departementName = DEPARTEMENTS.find(
    (departement) => departement.numero === row.departementAdministratif
  )?.name;

  return (
    <div className="col-span-full grid grid-cols-subgrid items-center text-default-grey whitespace-nowrap border-t border-default-grey py-3 text-sm">
      <span className="font-bold">{row.operateurName}</span>
      <span>
        {departementName} ({row.departementAdministratif})
      </span>
      <span className="whitespace-normal">{row.summary}</span>
      <span>
        {row.updatedAt && <>Modifié le {formatDate(row.updatedAt)}</>}
      </span>
      <span className="flex justify-center">
        <Badge type={statusBadgeType[row.status]}>
          {statusLabels[row.status]}
        </Badge>
      </span>
      <span className="justify-self-end">
        <Link
          href={row.actionUrl}
          aria-label="Ouvrir la création, transformation ou fermeture"
        >
          <span className="fr-icon-arrow-right-line text-title-blue-france" />
        </Link>
      </span>
    </div>
  );
};

type Props = {
  row: DashboardTransformationRow;
};

const statusLabels: Record<DashboardTransformationStatus, string> = {
  A_FINALISER: "À finaliser",
  A_INITIALISER: "À initialiser",
};

const statusBadgeType: Record<DashboardTransformationStatus, BadgeType> = {
  A_FINALISER: "yellow",
  A_INITIALISER: "warning",
};
