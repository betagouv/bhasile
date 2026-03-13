"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import FormWrapper from "@/app/components/forms/FormWrapper";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { CURRENT_YEAR } from "@/constants";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { typeBatiAndAdressesSchema } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

import { AdressesList } from "../../[id]/02-adresses/AdressesList";

export default function FormAdresses() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = `/ajout-structure/${params.id}/01-identification`;
  const resetRoute = `/ajout-structure/${params.id}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.id}/05-verification`
    : `/ajout-structure/${params.id}/03-type-places`;

  const defaultValues = useMemo(
    () => ({
      typeBati: undefined,
      adresses: [
        {
          adresseComplete: "",
          adresse: "",
          codePostal: "",
          commune: "",
          departement: "",
          repartition: Repartition.DIFFUS,
          adresseTypologies: [
            {
              year: CURRENT_YEAR,
              placesAutorisees: undefined as unknown as number,
              logementSocial: false,
              qpv: false,
            },
          ],
        },
      ],
    }),
    []
  );

  const { currentValue: localStorageValues } = useLocalStorage<
    typeof defaultValues
  >(`ajout-structure-${params.id}-adresses`, {} as typeof defaultValues);

  const { currentValue: localStorageIdentificationValues } =
    useLocalStorage<AjoutIdentificationFormValues>(
      `ajout-structure-${params.id}-identification`,
      {} as AjoutIdentificationFormValues
    );

  const mergedDefaultValues = useMemo(() => {
    if (!localStorageValues || Object.keys(localStorageValues).length === 0) {
      return defaultValues;
    }
    return {
      ...defaultValues,
      ...localStorageValues,
    };
  }, [localStorageValues, defaultValues]);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (localStorageValues && !isInitialized) {
      setIsInitialized(true);
    }
  }, [localStorageValues, isInitialized]);

  return (
    <FormWrapper
      schema={typeBatiAndAdressesSchema}
      localStorageKey={`ajout-structure-${params.id}-adresses`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onBlur"
      defaultValues={mergedDefaultValues}
      submitButtonText={
        isEditMode ? "Modifier et revenir à la vérification" : "Étape suivante"
      }
    >
      {({ control, setValue, getValues, watch }) => {
        const handleTypeBatiChange = (value: string) => {
          const currentAdresses = getValues("adresses") || [];

          if (value !== Repartition.COLLECTIF) {
            setValue("sameAddress", false);
          }

          if (currentAdresses.length === 0) {
            setValue(
              "adresses",
              [
                {
                  adresseComplete: "",
                  adresse: "",
                  codePostal: "",
                  commune: "",
                  repartition: value as Repartition,
                  adresseTypologies: [
                    {
                      placesAutorisees: undefined as unknown as number,
                      year: CURRENT_YEAR,
                      logementSocial: false,
                      qpv: false,
                    },
                  ],
                },
              ],
              { shouldValidate: false }
            );
          } else {
            const updatedAdresses = currentAdresses.map((adresse) => ({
              ...adresse,
              repartition: value as Repartition,
            }));

            setValue("adresses", updatedAdresses, {
              shouldValidate: false,
            });
          }

          if (value === Repartition.COLLECTIF) {
            const updatedAdresses = currentAdresses.slice(0, 1);

            setValue("adresses", updatedAdresses, {
              shouldValidate: false,
            });
          }
        };

        return (
          <>
            <Link
              href={previousRoute}
              className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8"
            >
              <i className="fr-icon-arrow-left-s-line before:w-4"></i>
              Étape précédente
            </Link>

            <p className="max-w-3xl">
              Veuillez d’abord renseigner le type de bâti puis l’ensemble des
              adresses d’hébergement de la structure, et les informations
              associées, au 1er janvier de l’année en cours.
            </p>
            <fieldset className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectWithValidation
                  name="typeBati"
                  control={control}
                  label="Type de bâti"
                  onChange={handleTypeBatiChange}
                  required
                >
                  <option value="">Sélectionnez une option</option>

                  {Object.values(Repartition).map((repartition) => (
                    <option key={repartition} value={repartition}>
                      {repartition}
                    </option>
                  ))}
                </SelectWithValidation>
              </div>
            </fieldset>
            {watch("typeBati") && (
              <AdressesList
                adminAddress={{
                  adresseAdministrativeComplete:
                    localStorageIdentificationValues?.adresseAdministrativeComplete,
                  adresseAdministrative:
                    localStorageIdentificationValues?.adresseAdministrative,
                  codePostalAdministratif:
                    localStorageIdentificationValues?.codePostalAdministratif,
                  communeAdministrative:
                    localStorageIdentificationValues?.communeAdministrative,
                  departementAdministratif:
                    localStorageIdentificationValues?.departementAdministratif,
                  nom: localStorageIdentificationValues?.nom,
                }}
              />
            )}
          </>
        );
      }}
    </FormWrapper>
  );
}
