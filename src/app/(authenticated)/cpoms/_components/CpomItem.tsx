import Link from "next/link";
import { ReactElement } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { computeCpomDates, getGranularityLabel } from "@/app/utils/cpom.util";
import { getYearFromDate } from "@/app/utils/date.util";
import { CpomApiType } from "@/schemas/api/cpom.schema";

export const CpomItem = ({ cpom, index }: Props) => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);

  const isCpomFinalized =
    cpom.actesAdministratifs?.length &&
    cpom.actesAdministratifs?.[0]?.fileUploads?.[0]?.key &&
    dateStart &&
    dateEnd;

  return (
    <tr
      id={`table-row-key-${index}`}
      data-row-key={index}
      className="border-t border-default-grey"
    >
      <td className="text-left!">{cpom.operateur?.name}</td>
      <td className="text-left!">{getGranularityLabel(cpom)}</td>
      <td className="text-left!">{cpom.region}</td>
      <td className="text-left!">{getDepartementsLabel(cpom)}</td>
      <td className="">
        {getYearFromDate(dateStart) || <EmptyCell className="[&>div]:mx-0.5" />}
      </td>
      <td className="">
        {getYearFromDate(dateEnd) || <EmptyCell className="[&>div]:mx-0.5" />}
      </td>
      <td>
        {isCpomFinalized ? (
          <Link
            className="fr-btn--tertiary-no-outline fr-icon-arrow-right-line"
            title={`Voir le CPOM ${cpom.id}`}
            href={`cpoms/${cpom.id}`}
          />
        ) : (
          <Link
            className="fr-btn--tertiary-no-outline fr-icon-edit-line"
            title={`Ajouter le CPOM ${cpom.id}`}
            href={`cpoms/${cpom.id}/ajout/01-identification`}
          />
        )}
      </td>
    </tr>
  );
};

const getDepartementsLabel = (cpom: CpomApiType): string | ReactElement => {
  let departements: string | ReactElement = (
    <span>{cpom.departements?.join(", ")}</span>
  );
  if (cpom.granularity === "REGIONALE") {
    departements = (
      <span className="flex">
        <EmptyCell className="[&>div]:mx-0.5" />
      </span>
    );
  }
  return departements;
};

type Props = {
  cpom: CpomApiType;
  index: number;
};
