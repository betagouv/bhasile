"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";

export default function TransformationActesAdministratifsPage({}) {
  const {
    transformationId,
    transformationStructureStep,
    transformationStructureType,
    transformationStructureId,
  } = useParams();

  const { nextStep, prevStep } = useTransformationFormHandling();

  return (
    <div>
      <h1>Transformation - {transformationStructureStep}</h1>
      <p>transformationId: {transformationId}</p>
      <p>transformationStructureType: {transformationStructureType}</p>
      <p>transformationStructureId: {transformationStructureId}</p>
      {prevStep && <Link href={prevStep.route}>Previous</Link>}
      {nextStep && <Link href={nextStep.route}>Next</Link>}
    </div>
  );
}
