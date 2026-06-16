"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformationFormNavigation } from "@/app/hooks/useTransformationFormNavigation";
import { useTransformations } from "@/app/hooks/useTransformations";
import { sortStructureVersionTransformationsByType } from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import { useTransformationContext } from "../_context/TransformationClientContext";
import { StructureVersionTransformationGroup } from "./_components/StructureVersionTransformationGroup";

export default function TransformationVerificationPage() {
  const router = useRouter();

  const { transformation, setTransformation } = useTransformationContext();
  const { updateTransformation } = useTransformations();
  const { prevStep } = useTransformationFormNavigation();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const groups = groupStructureVersionTransformationsByType(
    transformation.structureVersionTransformations
  );

  const allChildFormsAreValidated =
    transformation.structureVersionTransformations.every(
      (structureVersionTransformation) =>
        structureVersionTransformation.form?.status === true
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
          <StructureVersionTransformationGroup
            key={group.type}
            type={group.type}
            structureVersionTransformations={group.items}
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
  type: StructureVersionTransformationType;
  items: StructureVersionTransformationApiRead[];
};

const groupStructureVersionTransformationsByType = (
  structureVersionTransformations: StructureVersionTransformationApiRead[]
): Group[] => {
  const sortedStructureVersionTransformations =
    sortStructureVersionTransformationsByType(structureVersionTransformations);
  return sortedStructureVersionTransformations.reduce<Group[]>(
    (accumulator, structureVersionTransformation) => {
      const lastGroup = accumulator[accumulator.length - 1];
      if (lastGroup && lastGroup.type === structureVersionTransformation.type) {
        lastGroup.items.push(structureVersionTransformation);
        return accumulator;
      }
      accumulator.push({
        type: structureVersionTransformation.type,
        items: [structureVersionTransformation],
      });
      return accumulator;
    },
    []
  );
};
