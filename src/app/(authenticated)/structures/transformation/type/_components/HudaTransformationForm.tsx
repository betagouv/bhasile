"use client";

import RadioCardGroup from "@/app/components/forms/RadioCardGroup";
import { TransformationType } from "@/types/transformation.type";

export const HudaTransformationForm = ({
  transformationType,
  setTransformationType,
}: Props) => {
  return (
    <RadioCardGroup
      name="type"
      options={[
        {
          value:
            TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
          label: "TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR",
        },
        {
          value:
            TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
          label: "TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR",
        },
        {
          value:
            TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
          label: "TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES",
        },
      ]}
      value={transformationType}
      onChange={(value) => setTransformationType(value as TransformationType)}
    />
  );
};

type Props = {
  transformationType?: TransformationType;
  setTransformationType: (transformationType: TransformationType) => void;
};
