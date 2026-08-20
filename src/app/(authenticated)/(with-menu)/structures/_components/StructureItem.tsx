import Button from "@codegouvfr/react-dsfr/Button";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { formatCityName } from "@/app/utils/adresse.util";
import { formatDate } from "@/app/utils/date.util";
import {
  StructureCommune,
  StructureListItem,
} from "@/types/structure-list.type";

import { TypeBatiBadge } from "./TypeBatiBadge";

export const StructureItem = ({
  structure,
  index,
  handleOpenModal,
  isClosed,
}: Props) => {
  return (
    <tr
      id={`table-row-key-${index}`}
      data-row-key={index}
      className={`border-t border-default-grey ${getBackgroundColor(structure.isFinalised, isClosed)}`}
    >
      <td className="text-left! whitespace-nowrap">{structure.codeBhasile}</td>
      <td className="text-left! whitespace-nowrap">{structure.type}</td>
      <td className="text-left!">{structure.operateurLabel}</td>
      <td className="text-left!">{structure.departementAdministratif}</td>
      <td className="text-left! whitespace-nowrap">
        {getCommuneLabel(structure.communes)}
      </td>
      <td className="text-left! whitespace-nowrap">
        <TypeBatiBadge typeBati={structure.bati} />
      </td>
      {isClosed ? (
        <>
          <td className="text-left!">
            {structure.fermetureDate ? (
              formatDate(structure.fermetureDate)
            ) : (
              <EmptyCell />
            )}
          </td>
          <td className="text-left!">
            {structure.fermetureMotif ?? <EmptyCell />}
          </td>
        </>
      ) : (
        <>
          <td className="text-left!">
            {structure.placesAutorisees || <EmptyCell />}
          </td>
          <td className="text-left!">
            {structure.finConvention ? (
              formatDate(structure.finConvention)
            ) : (
              <EmptyCell />
            )}
          </td>
        </>
      )}
      <td>
        {isClosed || structure.isFinalised ? (
          <Link
            className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-line before:w-[20] before:h-[20]"
            title={`Détails de la structure ${structure.codeBhasile}`}
            href={`structures/${structure.id}`}
            aria-label={`Détails de la structure ${structure.codeBhasile}`}
          />
        ) : (
          <Button
            onClick={() => handleOpenModal(structure)}
            priority="tertiary no outline"
            iconId="fr-icon-edit-line"
            className="before:w-[20] before:h-[20]"
            title={`Finaliser la création de la structure ${structure.codeBhasile}`}
          />
        )}
      </td>
    </tr>
  );
};

const getBackgroundColor = (
  isFinalised: boolean,
  isClosed: boolean
): string => {
  if (isClosed) {
    return "bg-contrast-grey";
  }
  if (!isFinalised) {
    return "bg-alt-blue-france";
  }
  return "bg-transparent";
};

const getCommuneLabel = (communes: StructureCommune[]) => {
  const [mainCommune, ...otherCommunes] = communes;
  return (
    <>
      <span>{formatCityName(mainCommune?.name)} </span>
      {mainCommune && otherCommunes.length > 0 && (
        <span className="underline text-mention-grey inline-flex ms-1">
          <Tooltip
            title={otherCommunes
              .map((commune) => formatCityName(commune.name))
              .join(", ")}
          >
            + {otherCommunes.length}
          </Tooltip>
        </span>
      )}
    </>
  );
};

type Props = {
  structure: StructureListItem;
  index: number;
  handleOpenModal: (structure: StructureListItem) => void;
  isClosed: boolean;
};
