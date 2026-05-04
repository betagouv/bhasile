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
          label:
            "Un ou plusieurs HUDA ferment et transfert leurs places à un CADA existant du même opérateur",
        },
        {
          value:
            TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
          label:
            "Un ou plusieurs HUDA ferment et transfert leurs places à un nouveau CADA du même opérateur",
        },
        {
          value:
            TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
          label:
            "Un ou plusieurs HUDA ferment et leurs places sont remises en concurrence",
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
