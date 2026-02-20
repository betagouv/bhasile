import Link from "next/link";
import { ReactElement } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { getYearFromDate } from "@/app/utils/date.util";
import { Cpom } from "@/types/cpom.type";

export const CpomItem = ({ cpom, index }: Props) => {
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
      <td className="">{getYearFromDate(cpom.dateStart)}</td>
      <td className="">{getYearFromDate(cpom.dateEnd)}</td>
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

const getDepartementsLabel = (cpom: Cpom): string | ReactElement => {
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

const getGranularityLabel = (cpom: Cpom): string => {
  switch (cpom.granularity) {
    case "REGIONALE":
      return "Régionale";
    case "INTERDEPARTEMENTALE":
      return "Interdépartementale";
    case "DEPARTEMENTALE":
      return "Départementale";
    default:
      return "";
  }
};

type Props = {
  cpom: Cpom;
  index: number;
};
