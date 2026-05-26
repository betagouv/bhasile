"use client";

import { useParams } from "next/navigation";

import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";

type Props = {
  structureTransformation: StructureTransformationApiRead;
};

export const ExtensionFlow = ({ structureTransformation }: Props) => {
  const { transformationStructureStep } = useParams();

  return (
    <div>
      {structureTransformation.type} - {transformationStructureStep}
    </div>
  );
};
