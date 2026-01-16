"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { StructureApiType } from "@/schemas/api/structure.schema";

import { StructureItem } from "./StructureItem";
import { StructuresTableHeadings } from "./StructuresTableHeadings";

const finalisationModal = createModal({
  id: "finalisation-modal",
  isOpenedByDefault: false,
});

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
        <StructuresTableHeadings ariaLabelledBy={ariaLabelledBy}>
          {structures.map((structure, index) => (
            <StructureItem
              key={structure.id}
              structure={structure}
              index={index}
              handleOpenModal={handleOpenModal}
            />
          ))}
        </StructuresTableHeadings>
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
