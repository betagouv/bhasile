"use client";

import { useState } from "react";

import RadioCardGroup from "@/app/components/forms/RadioCardGroup";
import { TransformationType } from "@/types/transformation.type";

export const HudaTransformationForm = ({
  transformationType,
  setTransformationType,
}: Props) => {
  const [departureKind, setDepartureKind] = useState<
    HudaDepartureKind | undefined
  >(undefined);

  return (
    <div className="flex flex-col gap-2">
      <RadioCardGroup
        name="departureKind"
        options={[
          { value: "fermeture", label: "Un ou plusieurs HUDA ferment" },
          {
            value: "contraction",
            label:
              "Un ou plusieurs HUDA font l’objet d’une contraction de leur nombre de places",
          },
        ]}
        value={departureKind}
        onChange={(value) => {
          setDepartureKind(value as HudaDepartureKind | undefined);
          setTransformationType(undefined);
        }}
      />
      {departureKind && (
        <RadioCardGroup
          name="type"
          options={optionsByDepartureKind[departureKind]}
          value={transformationType}
          onChange={(value) =>
            setTransformationType(value as TransformationType | undefined)
          }
        />
      )}
    </div>
  );
};

type HudaDepartureKind = "fermeture" | "contraction";

type Props = {
  transformationType?: TransformationType;
  setTransformationType: (
    transformationType: TransformationType | undefined
  ) => void;
};

const CADA_EXISTANT_LABEL =
  "Leurs places sont transférées à un ou plusieurs CADA existants";
const CADA_NOUVEAU_LABEL =
  "Leurs places sont transférées à un nouveau CADA";
const REMISE_EN_CONCURRENCE_LABEL = "Leurs places sont remises en concurrence";

const optionsByDepartureKind: Record<
  HudaDepartureKind,
  { value: TransformationType; label: string }[]
> = {
  fermeture: [
    {
      value: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
      label: CADA_EXISTANT_LABEL,
    },
    {
      value: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU,
      label: CADA_NOUVEAU_LABEL,
    },
    {
      value: TransformationType.TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE,
      label: REMISE_EN_CONCURRENCE_LABEL,
    },
  ],
  contraction: [
    {
      value: TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT,
      label: CADA_EXISTANT_LABEL,
    },
    {
      value: TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU,
      label: CADA_NOUVEAU_LABEL,
    },
    {
      value: TransformationType.TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE,
      label: REMISE_EN_CONCURRENCE_LABEL,
    },
  ],
};
