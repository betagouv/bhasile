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
import { Structure } from "@/types/structure.type";

import { RepartitionBadge } from "./RepartitionBadge";

export const StructureItem = ({ structure, index, handleOpenModal }: Props) => {
  const isStructureFinalisee = getFinalisationFormStatus(structure);

  return (
    <tr
      id={`table-row-key-${index}`}
      data-row-key={index}
      className={`border-t border-default-grey ${isStructureFinalisee ? "bg-transparent" : "bg-alt-blue-france"}`}
    >
      <td className="text-left!">{structure.dnaCode}</td>
      <td className="text-left!">{structure.type}</td>
      <td className="text-left!">
        {getOperateurLabel(structure.filiale, structure.operateur?.name)}
      </td>
      <td>{structure.departementAdministratif}</td>
      <td className="text-left!">
        <RepartitionBadge repartition={structure.repartition} />
      </td>
      <td className="text-left!">{getCommuneLabel(structure)}</td>
      <td>{structure.structureTypologies?.[0]?.placesAutorisees}</td>
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
            className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-line"
            title={`Détails de la structure ${structure.dnaCode}`}
            href={`structures/${structure.id}`}
          >
            Détails de la structure {structure.dnaCode}
          </Link>
        ) : (
          <Button
            onClick={() => handleOpenModal(structure)}
            className="fr-btn--tertiary-no-outline fr-icon-edit-line"
            title={`Finaliser la création de la structure ${structure.dnaCode}`}
          >
            Finaliser la création de la structure {structure.dnaCode}
          </Button>
        )}
      </td>
    </tr>
  );
};

const getCommuneLabel = (structure: Structure) => {
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
  structure: Structure;
  index: number;
  handleOpenModal: (structure: Structure) => void;
};
