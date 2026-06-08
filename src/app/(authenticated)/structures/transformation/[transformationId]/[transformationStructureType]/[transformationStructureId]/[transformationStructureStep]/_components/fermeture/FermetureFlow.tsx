"use client";

import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";

import { FermetureDescriptionForm } from "./FermetureDescriptionForm";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const FermetureFlow = ({
  transformation,
  structureVersionTransformation,
}: Props) => (
  <FermetureDescriptionForm
    transformation={transformation}
    structureVersionTransformation={structureVersionTransformation}
  />
);
