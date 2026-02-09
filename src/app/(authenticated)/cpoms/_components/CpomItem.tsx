import Link from "next/link";
import { ReactElement } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearFromDate } from "@/app/utils/date.util";
import { CpomApiType } from "@/schemas/api/cpom.schema";

export const CpomItem = ({ cpom, index }: Props) => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);

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
      <td className="">{getYearFromDate(dateStart)}</td>
      <td className="">{getYearFromDate(dateEnd)}</td>
      <td>
        <Link
          className="fr-btn--tertiary-no-outline fr-icon-edit-line"
          title={`Modifier le CPOM ${cpom.id}`}
          href={`cpoms/${cpom.id}/modification/01-identification`}
        />
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

const getGranularityLabel = (cpom: CpomApiType): string => {
  switch (cpom.granularity) {
    case "REGIONALE":
      return "Régionale";
    case "INTERDEPARTEMENTALE":
      return "Interdépartementale";
    case "DEPARTEMENTALE":
      return "Départementale";
  }
};

type Props = {
  cpom: CpomApiType;
  index: number;
};
