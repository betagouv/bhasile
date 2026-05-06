"use client";

import { useState } from "react";

import RadioCardGroup from "@/app/components/forms/RadioCardGroup";
import { TransformationType } from "@/types/transformation.type";

import { FromStructureCard } from "./FromStructureCard";

export const FromStructureTransformationForm = ({
  structureId,
  transformationType,
  setTransformationType,
}: Props) => {
  const [firstSelectedOption, setFirstSelectedOption] = useState<
    "extension" | "contraction" | "fermeture" | undefined
  >(undefined);
  return (
    <>
      <FromStructureCard structureId={structureId} />
      <div className="flex flex-col gap-2">
        <RadioCardGroup
          name="firstSelectedOption"
          options={[
            {
              value: "extension",
              label:
                "Cette structure fait l'objet d'une extension de son nombre de places",
            },
            {
              value: "contraction",
              label:
                "Cette structure fait l'objet d'une contraction de son nombre de places",
            },
            { value: "fermeture", label: "Cette structure ferme" },
          ]}
          value={firstSelectedOption}
          onChange={(value) => {
            setFirstSelectedOption(
              value as "extension" | "contraction" | "fermeture"
            );
            setTransformationType(undefined);
          }}
        />
        {firstSelectedOption && (
          <RadioCardGroup
            name="type"
            options={optionsByFirstSelectedOption[firstSelectedOption]}
            value={transformationType}
            onChange={(value) =>
              setTransformationType(value as TransformationType)
            }
          />
        )}
      </div>
    </>
  );
};

type Props = {
  structureId: number;
  transformationType?: TransformationType;
  setTransformationType: (
    transformationType: TransformationType | undefined
  ) => void;
};

const optionsByFirstSelectedOption = {
  extension: [
    {
      value: TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT,
      label:
        "Les nouvelles places sont issues d’une ou plusieurs autres structures n’ayant pas fermé (contraction).",
    },
    {
      value: TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT,
      label:
        "Les nouvelles places sont issues d’une ou plusieurs autres structures ayant fermé.",
    },
    {
      value: TransformationType.EXTENSION_EX_NIHILO,
      label: "Les nouvelles places sont créées.",
    },
  ],
  contraction: [
    {
      value: TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE,
      label:
        "Ses places sont transférées à une ou plusieurs autres structures existantes (extension).",
    },
    {
      value: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
      label: "Ses places ne sont pas transférées.",
    },
  ],
  fermeture: [
    {
      value:
        TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES,
      label:
        "Ses places sont transférées à une ou plusieurs autres structures existantes (extension).",
    },
    {
      value: TransformationType.FERMETURE_SANS_TRANSFERT,
      label: "Ses places ne sont pas transférées.",
    },
  ],
};
