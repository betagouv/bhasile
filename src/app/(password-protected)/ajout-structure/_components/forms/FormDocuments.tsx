"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { FieldSetYearlyDocumentsFinanciers } from "@/app/components/forms/fieldsets/structure/FieldSetYearlyDocumentsFinanciers";
import { Date303 } from "@/app/components/forms/finance/documents/Date303";
import FormWrapper from "@/app/components/forms/FormWrapper";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { getDocumentsFinanciersYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { DocumentsFinanciersFlexibleSchema } from "@/schemas/forms/base/documentFinancier.schema";
import { FormKind } from "@/types/global";

export default function FormDocuments() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = `/ajout-structure/${params.dnaCode}/03-type-places`;
  const resetRoute = `/ajout-structure/${params.dnaCode}/01-identification`;
  const nextRoute = `/ajout-structure/${params.dnaCode}/05-verification`;

  const { currentValue: localStorageIdentificationValues } = useLocalStorage(
    `ajout-structure-${params.dnaCode}-identification`,
    {}
  );
  const { currentValue: localStorageValues } = useLocalStorage(
    `ajout-structure-${params.dnaCode}-documents`,
    {}
  );

  const mergedDefaultValues = useMemo(() => {
    return {
      ...localStorageValues,
      creationDate: (
        localStorageIdentificationValues as AjoutIdentificationFormValues
      )?.creationDate,
    };
  }, [localStorageValues, localStorageIdentificationValues]);

  const { currentValue } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.dnaCode}-identification`, {});

  const isAutorisee = isStructureAutorisee(currentValue?.type);

  const { years } = getDocumentsFinanciersYearRange({ isAutorisee });

  return (
    <FormWrapper
      schema={DocumentsFinanciersFlexibleSchema}
      localStorageKey={`ajout-structure-${params.dnaCode}-documents`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onChange"
      defaultValues={mergedDefaultValues}
      className="gap-0"
      submitButtonText={
        isEditMode ? "Modifier et revenir à la vérification" : "Vérifier"
      }
    >
      {({ control, watch }) => {
        const date303 = watch("date303");
        const startYear = date303
          ? Number(date303?.split("/")?.[2])
          : Number(currentValue?.creationDate?.split("/")?.[2]);

        const noYear = years.filter((year) => year >= startYear).length === 0;

        return (
          <>
            <Link
              href={previousRoute}
              className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8"
            >
              <i className="fr-icon-arrow-left-s-line before:w-4"></i>
              Etape précédente
            </Link>
            <p>
              Veuillez importer les documents financiers demandés concernant les
              cinq dernières années.
            </p>
            <Date303 />
            <hr className="mb-8" />
            {noYear && (
              <p className="text-disabled-grey mb-0 text-sm">
                La structure est trop récente et n’est pas en mesure de fournir
                de documents. Vous pouvez valider cette étape.
              </p>
            )}

            {years.map((year) => (
              <FieldSetYearlyDocumentsFinanciers
                key={year}
                year={year}
                startYear={startYear}
                isAutorisee={isAutorisee}
                control={control}
                formKind={FormKind.AJOUT}
              />
            ))}
          </>
        );
      }}
    </FormWrapper>
  );
}
