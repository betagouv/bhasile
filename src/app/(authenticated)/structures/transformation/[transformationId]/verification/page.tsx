"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformationFormNavigation } from "@/app/hooks/useTransformationFormNavigation";
import { useTransformations } from "@/app/hooks/useTransformations";
import { sortStructureTransformationsByType } from "@/app/utils/transformation.util";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StructureTransformationType } from "@/types/transformation.type";

import { useTransformationContext } from "../_context/TransformationClientContext";
import { StructureTransformationGroup } from "./_components/StructureTransformationGroup";

export default function TransformationVerificationPage() {
  const router = useRouter();

  const { transformation, setTransformation } = useTransformationContext();
  const { updateTransformation } = useTransformations();
  const { prevStep } = useTransformationFormNavigation();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const groups = groupStructureTransformationsByType(
    transformation.structureTransformations
  );

  const allChildFormsAreValidated =
    transformation.structureTransformations.every(
      (structureTransformation) =>
        structureTransformation.forms?.[0]?.status === true
    );
  const canSubmit =
    transformation.form !== undefined &&
    allChildFormsAreValidated &&
    saveState !== FetchState.LOADING;

  const handleSubmit = async () => {
    if (!transformation.form) {
      return;
    }
    try {
      await updateTransformation(
        transformation.id,
        {
          id: transformation.id,
          form: { ...transformation.form, status: true },
        },
        setTransformation
      );
      router.push("/structures");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-6 mb-10 px-6">
      {prevStep && (
        <Link
          href={prevStep.route}
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line self-start"
        >
          Retour
        </Link>
      )}
      <h2 className="text-xl font-bold text-title-blue-france text-center mb-0">
        Confirmez-vous les informations suivantes&nbsp;?
      </h2>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <StructureTransformationGroup
            key={group.type}
            type={group.type}
            structureTransformations={group.items}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <Button
          disabled={!canSubmit}
          onClick={handleSubmit}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Je confirme et certifie les informations
        </Button>
      </div>
      {saveState === FetchState.ERROR && <SubmitError />}
    </div>
  );
}

type Group = {
  type: StructureTransformationType;
  items: StructureTransformationApiRead[];
};

const groupStructureTransformationsByType = (
  structureTransformations: StructureTransformationApiRead[]
): Group[] => {
  const sortedStructureTransformations = sortStructureTransformationsByType(
    structureTransformations
  );
  return sortedStructureTransformations.reduce<Group[]>(
    (accumulator, structureTransformation) => {
      const lastGroup = accumulator[accumulator.length - 1];
      if (lastGroup && lastGroup.type === structureTransformation.type) {
        lastGroup.items.push(structureTransformation);
        return accumulator;
      }
      accumulator.push({
        type: structureTransformation.type,
        items: [structureTransformation],
      });
      return accumulator;
    },
    []
  );
};
