"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { useCanUpdateDepartement } from "@/app/hooks/useCanUpdateStructure";
import { ListColumn } from "@/types/ListColumn";
import { StructureListItem } from "@/types/structure-list.type";

import { StructureItem } from "./StructureItem";

const finalisationModal = createModal({
  id: "finalisation-modal",
  isOpenedByDefault: false,
});

const noPermissionsModal = createModal({
  id: "no-permissions-modal",
  isOpenedByDefault: false,
});

export const SHARED_COLUMNS: ListColumn[] = [
  {
    label: "Code",
    column: "codeBhasile",
    orderBy: true,
  },
  {
    label: "Type",
    column: "type",
    orderBy: true,
  },
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
  },
  {
    label: "Dépt.",
    column: "departementAdministratif",
    orderBy: true,
  },
  {
    label: "Communes",
    column: "communes",
    orderBy: false,
  },
  {
    label: "Bâti",
    column: "bati",
    orderBy: true,
  },
];

export const ACTIVE_TRAILING_COLUMNS: ListColumn[] = [
  {
    label: "Places aut.",
    column: "placesAutorisees",
    orderBy: true,
  },
  {
    label: "Fin convention",
    column: "finConvention",
    orderBy: true,
  },
];

const CLOSED_TRAILING_COLUMNS: ListColumn[] = [
  {
    label: "Archivé le",
    column: "effectiveDate",
    orderBy: false,
  },
  {
    label: "Motif",
    column: "motif",
    orderBy: false,
  },
];

export const StructuresTable = ({
  structures,
  totalStructures,
  ariaLabelledBy,
  isClosed,
}: Props): ReactElement => {
  const router = useRouter();
  const canUpdateDepartement = useCanUpdateDepartement();

  const columns = [
    ...SHARED_COLUMNS,
    ...(isClosed ? CLOSED_TRAILING_COLUMNS : ACTIVE_TRAILING_COLUMNS),
  ];

  const [selectedStructure, setSelectedStructure] =
    useState<StructureListItem | null>(null);
  const handleOpenModal = (structure: StructureListItem) => {
    setSelectedStructure(structure);
    if (canUpdateDepartement(structure.departementAdministratif)) {
      finalisationModal.open();
    } else {
      noPermissionsModal.open();
    }
  };

  return (
    <>
      <div className="px-4 h-full">
        <ListTableHeadings ariaLabelledBy={ariaLabelledBy} columns={columns}>
          {structures.map((structure, index) => (
            <StructureItem
              key={structure.id}
              structure={structure}
              index={index}
              handleOpenModal={handleOpenModal}
              isClosed={isClosed}
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
        title="Vous n'avez pas les droits pour finaliser cette structure."
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
  structures: StructureListItem[];
  totalStructures: number;
  ariaLabelledBy: string;
  isClosed: boolean;
};
