"use client";

import RadioCardGroup from "@/app/components/forms/RadioCardGroup";
import { TransformationType } from "@/types/transformation.type";

export const CreationTransformationForm = ({
  transformationType,
  setTransformationType,
}: Props) => {
  return (
    <RadioCardGroup
      name="type"
      options={[
        {
          value: TransformationType.OUVERTURE_EX_NIHILO,
          label: "Une nouvelle structure est créée ex-nihilo",
        },
        {
          value:
            TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
          label:
            "Une nouvelle structure est créée à partir des places de plusieurs structures qui ferment",
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
