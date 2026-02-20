"use client";
import Notice from "@codegouvfr/react-dsfr/Notice";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Table } from "@/app/components/common/Table";
import FormWrapper from "@/app/components/forms/FormWrapper";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { cn } from "@/app/utils/classname.util";
import { getTypePlacesYearRange, getYearFromDate } from "@/app/utils/date.util";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { ajoutTypePlacesSchema } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";

export default function FormTypePlaces() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = `/ajout-structure/${params.dnaCode}/02-adresses`;
  const resetRoute = `/ajout-structure/${params.dnaCode}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.dnaCode}/05-verification`
    : `/ajout-structure/${params.dnaCode}/04-documents`;

  const { years } = getTypePlacesYearRange();
  const { currentValue: localStorageIdentificationValues } = useLocalStorage(
    `ajout-structure-${params.dnaCode}-identification`,
    {}
  );
  const yearsToDisplay = years.filter(
    (year) =>
      year >=
      getYearFromDate(
        (localStorageIdentificationValues as AjoutIdentificationFormValues)
          ?.creationDate
      )
  );

  const { currentValue: localStorageValues } = useLocalStorage(
    `ajout-structure-${params.dnaCode}-type-places`,
    {}
  );

  const mergedDefaultValues = useMemo(() => {
    return localStorageValues || {};
  }, [localStorageValues]);

  return (
    <FormWrapper
      schema={ajoutTypePlacesSchema}
      localStorageKey={`ajout-structure-${params.dnaCode}-type-places`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onBlur"
      defaultValues={mergedDefaultValues}
      className="gap-2"
      submitButtonText={
        isEditMode ? "Modifier et revenir à la vérification" : "Étape suivante"
      }
    >
      {({ control, register, formState }) => {
        const hasErrors = Object.values(formState.errors).length > 0;
        return (
          <>
            <Link
              href={previousRoute}
              className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8"
            >
              <i className="fr-icon-arrow-left-s-line before:w-4"></i>
              Étape précédente
            </Link>

            <p>
              Veuillez renseigner l’historique du nombre de places pour chaque
              typologie au 1er janvier de ces trois dernières années.
            </p>

            <Notice
              severity="info"
              title=""
              className="rounded [&_p]:flex  [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
              description="PMR : Personnes à Mobilité Réduite – LGBT : Lesbiennes, Gays, Bisexuels et Transgenres (ici places définies comme spécialisées) – FVV : Femmes Victimes de Violences, TEH : Traîte des Êtres Humains (ici places définies comme labellisées)"
            />

            <Table
              headings={["Année", "Autorisées", "PMR", "LGBT", "FVV/TEH"]}
              ariaLabelledBy=""
              className={cn(
                "[&_th]:px-0 text-center w-fit",
                hasErrors && "border-action-high-error"
              )}
            >
              {yearsToDisplay.map((year, index) => (
                <tr
                  key={year}
                  className="w-full [&_input]:max-w-[4rem] border-t border-default-grey "
                >
                  <td className="align-middle py-4">{year}</td>
                  <td className="!py-4">
                    <InputWithValidation
                      name={`typologies.${index}.placesAutorisees`}
                      id={`typologies.${index}.placesAutorisees`}
                      control={control}
                      type="number"
                      min={0}
                      label=""
                      className="mb-0 mx-auto items-center [&_p]:hidden"
                      variant="simple"
                    />
                  </td>
                  <td className="!py-1">
                    <InputWithValidation
                      name={`typologies.${index}.pmr`}
                      id={`typologies.${index}.pmr`}
                      control={control}
                      type="number"
                      min={0}
                      label=""
                      className="mb-0 mx-auto items-center [&_p]:hidden"
                      variant="simple"
                    />
                  </td>
                  <td className="!py-1">
                    <InputWithValidation
                      name={`typologies.${index}.lgbt`}
                      id={`typologies.${index}.lgbt`}
                      control={control}
                      type="number"
                      min={0}
                      label=""
                      className="mb-0 mx-auto items-center [&_p]:hidden"
                      variant="simple"
                    />
                  </td>
                  <td className="!py-1">
                    <InputWithValidation
                      name={`typologies.${index}.fvvTeh`}
                      id={`typologies.${index}.fvvTeh`}
                      control={control}
                      type="number"
                      min={0}
                      label=""
                      className="mb-0 mx-auto items-center [&_p]:hidden"
                      variant="simple"
                    />
                    <input
                      aria-hidden="true"
                      defaultValue={year}
                      type="hidden"
                      {...register(`typologies.${index}.year`)}
                    />
                  </td>
                </tr>
              ))}
            </Table>
            {hasErrors && (
              <p className="text-label-red-marianne">
                Toutes les cases doivent être remplies
              </p>
            )}
          </>
        );
      }}
    </FormWrapper>
  );
}
