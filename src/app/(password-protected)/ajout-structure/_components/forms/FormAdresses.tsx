"use client";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AddressWithValidation from "@/app/components/forms/AddressWithValidation";
import FormWrapper from "@/app/components/forms/FormWrapper";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { CURRENT_YEAR } from "@/constants";
import { ajoutAdressesSchema } from "@/schemas/forms/ajout/ajoutAdresses.schema";
import { Repartition } from "@/types/adresse.type";

import { AdressesList } from "../../[id]/02-adresses/AdressesList";

export default function FormAdresses() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = `/ajout-structure/${params.dnaCode}/01-identification`;
  const resetRoute = `/ajout-structure/${params.dnaCode}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.dnaCode}/05-verification`
    : `/ajout-structure/${params.dnaCode}/03-type-places`;

  const defaultValues = useMemo(
    () => ({
      nom: "",
      adresseAdministrative: "",
      codePostalAdministratif: "",
      communeAdministrative: "",
      departementAdministratif: "",
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
  >(`ajout-structure-${params.dnaCode}-adresses`, {} as typeof defaultValues);
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
      schema={ajoutAdressesSchema}
      localStorageKey={`ajout-structure-${params.dnaCode}-adresses`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onBlur"
      defaultValues={mergedDefaultValues}
      submitButtonText={
        isEditMode ? "Modifier et revenir à la vérification" : "Étape suivante"
      }
    >
      {({ control, setValue, getValues, watch, setError }) => {
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

        const handleAddressAdministrativeChange = () => {
          if (
            watch("typeBati") === Repartition.COLLECTIF &&
            watch("sameAddress")
          ) {
            setTimeout(() => {
              const currentAdresses = getValues("adresses") || [];
              if (currentAdresses.length > 0) {
                const updatedAdresses = [
                  {
                    ...currentAdresses[0],
                    adresseComplete: getValues("adresseAdministrativeComplete"),
                    adresse: getValues("adresseAdministrative"),
                    codePostal: getValues("codePostalAdministratif"),
                    commune: getValues("communeAdministrative"),
                    departement: getValues("departementAdministratif"),
                  },
                ];
                setValue("adresses", updatedAdresses, {
                  shouldValidate: true,
                });
              }
            }, 100);
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

            <Notice
              severity="info"
              title=""
              className="rounded [&_p]:flex  [&_p]:items-center"
              description="L’ensemble des adresses ne seront communiquées qu’aux agentes et agents en charge de cette politique publique."
            />
            <fieldset className="flex flex-col gap-6">
              <legend className="text-xl font-bold mb-4 text-title-blue-france">
                Adresse administrative
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <InputWithValidation
                    name="nom"
                    control={control}
                    type="text"
                    label="Nom de la structure (optionnel)"
                    className="mb-0"
                  />
                  <span className="text-[#666666] text-sm">
                    ex. Les Coquelicots
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <AddressWithValidation
                    control={control}
                    fullAddress="adresseAdministrativeComplete"
                    id="adresseAdministrativeComplete"
                    zipCode="codePostalAdministratif"
                    street="adresseAdministrative"
                    city="communeAdministrative"
                    department="departementAdministratif"
                    label="Adresse principale de la structure"
                    onSelectSuggestion={handleAddressAdministrativeChange}
                  />
                  <span className="text-[#666666] text-sm">
                    indiquée dans les documents de contractualisation
                  </span>
                </div>
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
                watch={watch}
                control={control}
                setValue={setValue}
                getValues={getValues}
                setError={setError}
              />
            )}
          </>
        );
      }}
    </FormWrapper>
  );
}
