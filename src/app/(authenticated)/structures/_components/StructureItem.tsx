import Button from "@codegouvfr/react-dsfr/Button";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { formatCityName } from "@/app/utils/adresse.util";
import { formatDate } from "@/app/utils/date.util";
import { getFinalisationFormStatus } from "@/app/utils/finalisationForm.util";
import {
  getOperateurLabel,
  getPlacesByCommunes,
} from "@/app/utils/structure.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import { RepartitionBadge } from "./RepartitionBadge";

export const StructureItem = ({ structure, index, handleOpenModal }: Props) => {
  const isStructureFinalisee = getFinalisationFormStatus(structure);

  return (
    <tr
      id={`table-row-key-${index}`}
      data-row-key={index}
      className={`border-t border-default-grey ${isStructureFinalisee ? "bg-transparent" : "bg-alt-blue-france"}`}
    >
      <td className="text-left! whitespace-nowrap">{structure.codeBhasile}</td>
      <td className="text-left! whitespace-nowrap">{structure.type}</td>
      <td className="text-left!">
        {getOperateurLabel(structure.filiale, structure.operateur?.name)}
      </td>
      <td className="text-left!">{structure.departementAdministratif}</td>
      <td className="text-left! whitespace-nowrap">
        {getCommuneLabel(structure)}
      </td>
      <td className="text-left! whitespace-nowrap">
        <RepartitionBadge repartition={structure.repartition} />
      </td>
      <td className="text-left!">
        {structure.structureTypologies?.[0]?.placesAutorisees}
      </td>
      <td className="text-left!">
        {structure.finConvention ? (
          formatDate(structure.finConvention)
        ) : (
          <EmptyCell />
        )}
      </td>
      <td>
        {isStructureFinalisee ? (
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

const getCommuneLabel = (structure: StructureApiRead) => {
  const placesByCommune = getPlacesByCommunes(structure.adresses || []);
  const mainCommune = Object.keys(placesByCommune)[0];
  const formattedMainCommune = formatCityName(mainCommune);
  const communesWithoutMainCommune = Object.keys(placesByCommune).filter(
    (commune) => commune !== mainCommune
  );
  const formattedCommunesWithoutMainCommune = communesWithoutMainCommune.map(
    (commune) => formatCityName(commune)
  );
  return (
    <>
      <span>{formattedMainCommune} </span>
      {mainCommune && communesWithoutMainCommune.length > 0 && (
        <span className="underline text-mention-grey inline-flex ms-1">
          <Tooltip title={formattedCommunesWithoutMainCommune.join(", ")}>
            + {communesWithoutMainCommune.length}
          </Tooltip>
        </span>
      )}
    </>
  );
};

type Props = {
  structure: StructureApiRead;
  index: number;
  handleOpenModal: (structure: StructureApiRead) => void;
};
