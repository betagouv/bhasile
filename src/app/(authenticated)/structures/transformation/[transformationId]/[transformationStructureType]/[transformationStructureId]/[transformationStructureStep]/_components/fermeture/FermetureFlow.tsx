"use client";

import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";

import { FermetureDescriptionForm } from "./FermetureDescriptionForm";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const FermetureFlow = ({
  transformation,
  structureTransformation,
}: Props) => (
  <FermetureDescriptionForm
    transformation={transformation}
    structureTransformation={structureTransformation}
  />
);
