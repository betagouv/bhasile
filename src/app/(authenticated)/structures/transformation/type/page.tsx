"use client";

import { useSearchParams } from "next/navigation";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as "creation" | "huda" | undefined;

  return <TransformationTypeForms formType={type} structureId={structureId} />;
}
