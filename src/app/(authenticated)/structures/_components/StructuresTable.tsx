"use client";

import { subject } from "@casl/ability";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement, useContext, useState } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { AbilityContext } from "@/app/context/AbilityContext";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { ListColumn } from "@/types/ListColumn";

import { StructureItem } from "./StructureItem";

const finalisationModal = createModal({
  id: "finalisation-modal",
  isOpenedByDefault: false,
});

const noPermissionsModal = createModal({
  id: "no-permissions-modal",
  isOpenedByDefault: false,
});

const COLUMNS: ListColumn[] = [
  {
    label: "Code",
    column: "codeBhasile",
    orderBy: true,
    centered: false,
  },
  {
    label: "Type",
    column: "type",
    orderBy: true,
    centered: false,
  },
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
    centered: false,
  },
  {
    label: "Dépt.",
    column: "departementAdministratif",
    orderBy: true,
    centered: false,
  },
  {
    label: "Communes",
    column: "communes",
    orderBy: false,
    centered: false,
  },
  {
    label: "Bâti",
    column: "bati",
    orderBy: true,
    centered: false,
  },

  {
    label: "Places aut.",
    column: "placesAutorisees",
    orderBy: true,
    centered: false,
  },
  {
    label: "Fin convention",
    column: "finConvention",
    orderBy: true,
    centered: false,
  },
];

export const StructuresTable = ({
  structures,
  totalStructures,
  ariaLabelledBy,
}: Props): ReactElement => {
  const router = useRouter();
  const ability = useContext(AbilityContext);

  const [selectedStructure, setSelectedStructure] =
    useState<StructureApiType | null>(null);
  const handleOpenModal = (structure: StructureApiType) => {
    setSelectedStructure(structure);
    if (ability.can("update", subject("Structure", structure))) {
      finalisationModal.open();
    } else {
      noPermissionsModal.open();
    }
  };

  return (
    <>
      <div className="px-4 h-full">
        <ListTableHeadings ariaLabelledBy={ariaLabelledBy} columns={COLUMNS}>
          {structures.map((structure, index) => (
            <StructureItem
              key={structure.id}
              structure={structure}
              index={index}
              handleOpenModal={handleOpenModal}
            />
          ))}
        </ListTableHeadings>
        <div className="pt-4 flex justify-center items-center">
          <Pagination totalElements={totalStructures} />
        </div>
      </div>
      <finalisationModal.Component
        title="Veuillez finaliser la création de cette structure."
        buttons={[
          {
            doClosesModal: true,
            children: "Annuler",
            type: "button",
          },
          {
            doClosesModal: false,
            children: "Je finalise la création",
            type: "button",
            onClick: () =>
              router.push(
                `/structures/${selectedStructure?.id}/finalisation/01-identification`
              ),
          },
        ]}
      >
        <p>
          La création de cette structure n’est pas terminée : son opérateur a
          transmis les données demandées mais celles-ci doivent être vérifiées
          et complétées par un agent ou une agente.
        </p>
      </finalisationModal.Component>
      <noPermissionsModal.Component
        title="La page de cette structure n’est pas encore finalisée."
        buttons={[
          {
            doClosesModal: true,
            children: "J'ai compris",
            type: "button",
          },
        ]}
      >
        <p>
          Toutes les informations concernant cette structure n’ont pas encore
          été saisies. Veuillez attendre qu’une personne disposant des droits
          nécessaires finalise sa création afin de pouvoir consulter cette page.
        </p>
      </noPermissionsModal.Component>
    </>
  );
};

type Props = {
  structures: StructureApiType[];
  totalStructures: number;
  ariaLabelledBy: string;
};
