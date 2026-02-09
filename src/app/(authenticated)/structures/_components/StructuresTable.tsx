"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { ListColumn } from "@/types/ListColumn";

import { StructureItem } from "./StructureItem";

const finalisationModal = createModal({
  id: "finalisation-modal",
  isOpenedByDefault: false,
});

const COLUMNS: ListColumn[] = [
  {
    label: "DNA",
    column: "dnaCode",
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
    centered: true,
  },
  {
    label: "Bâti",
    column: "bati",
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
    label: "Places aut.",
    column: "placesAutorisees",
    orderBy: true,
    centered: true,
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

  const [selectedStructure, setSelectedStructure] =
    useState<StructureApiType | null>(null);
  const handleOpenModal = (structure: StructureApiType) => {
    setSelectedStructure(structure);
    finalisationModal.open();
  };

  return (
    <>
      <div className="p-4 bg-alt-grey h-full">
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
    </>
  );
};

type Props = {
  structures: StructureApiType[];
  totalStructures: number;
  ariaLabelledBy: string;
};
