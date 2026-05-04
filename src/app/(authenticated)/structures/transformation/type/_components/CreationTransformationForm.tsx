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
          label: "OUVERTURE_EX_NIHILO",
        },
        {
          value:
            TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
          label: "OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES",
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
