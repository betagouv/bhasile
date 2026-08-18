import Link from "next/link";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import {
  getDepartementsList,
  getGranularityLabel,
} from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";
import { CpomListItem } from "@/types/cpom.type";

export const CpomItem = ({ cpom, index }: Props) => {
  return (
    <tr
      id={`table-row-key-${index}`}
      data-row-key={index}
      className="border-t border-default-grey h-12"
    >
      <td className="text-left! min-h-9 py-0!">{cpom.operateurName}</td>
      <td className="text-left! py-0!">
        {getGranularityLabel(cpom.granularity)}
      </td>
      <td className="text-left! py-0!">{cpom.regionName}</td>
      <td className="text-left! py-0!">
        {cpom.granularity === "REGIONALE" ? (
          <span className="flex">
            <EmptyCell className="[&>div]:mx-0.5" />
          </span>
        ) : (
          getDepartementsList(cpom.departementNumeros, 17)
        )}
      </td>
      <td className="text-left! py-0!"> {formatDate(cpom.dateStart)}</td>
      <td className="text-left! py-0!"> {formatDate(cpom.dateEnd)}</td>
      <td className="text-left! py-0!">{cpom.structureCount}</td>
      <td className="py-0!">
        {cpom.isFinalised ? (
          <Link
            className="fr-btn--tertiary-no-outline fr-icon-arrow-right-line before:w-[20] before:h-[20]"
            title={`Voir le CPOM ${cpom.id}`}
            href={`cpoms/${cpom.id}`}
          />
        ) : (
          <Link
            className="fr-btn--tertiary-no-outline fr-icon-edit-line before:w-[20] before:h-[20]"
            title={`Ajouter le CPOM ${cpom.id}`}
            href={`cpoms/${cpom.id}/ajout/01-identification`}
          />
        )}
      </td>
    </tr>
  );
};

type Props = {
  cpom: CpomListItem;
  index: number;
};
