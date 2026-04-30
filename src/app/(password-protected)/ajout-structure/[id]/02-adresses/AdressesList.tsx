import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";

import AddressWithValidation from "@/app/components/forms/AddressWithValidation";
import { ImportOptionNotices } from "@/app/components/forms/hebergement/ImportOptionNotices";
import { ManualOptionNotices } from "@/app/components/forms/hebergement/ManualOptionNotices";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { CURRENT_YEAR } from "@/constants";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { AdresseAdministrativeFormValues } from "@/schemas/forms/base/adresseAdministrative.schema";
import { Repartition } from "@/types/adresse.type";

export const AdressesList = ({ adminAddress }: AdressesListProps) => {
  const { watch, control, setValue, getValues } = useFormContext();
  const typeBati = watch("typeBati") || Repartition.DIFFUS;

  const sameAddress = watch("sameAddress");

  const hebergementsContainerRef = useRef(null);

  useEffect(() => {
    if (hebergementsContainerRef.current) {
      autoAnimate(hebergementsContainerRef.current);
    }
  }, [hebergementsContainerRef]);

  const handleAddAddress = () => {
    const newAddress: FormAdresse = {
      structureId: undefined,
      adresseComplete: "",
      adresse: "",
      codePostal: "",
      commune: "",
      departement: "",
      repartition:
        typeBati === Repartition.MIXTE ? Repartition.DIFFUS : typeBati,
      adresseTypologies: [
        {
          placesAutorisees: undefined as unknown as number,
          year: CURRENT_YEAR,
          logementSocial: false,
          qpv: false,
        },
      ],
    };
    const currentAddresses = getValues("adresses") || [];
    const updatedAddresses = [...currentAddresses, newAddress];
    setValue("adresses", updatedAddresses, {
      shouldValidate: false,
    });
  };

  const handleRemoveAddress = (index: number) => {
    const currentAddresses = getValues("adresses") || [];
    const updatedAddresses = [...currentAddresses];
    updatedAddresses.splice(index, 1);
    setValue("adresses", updatedAddresses, {
      shouldValidate: false,
    });
  };

  const handleSameAddressChange = () => {
    if (
      !adminAddress.adresseAdministrativeComplete ||
      !adminAddress.adresseAdministrative ||
      !adminAddress.codePostalAdministratif ||
      !adminAddress.communeAdministrative
    ) {
      return;
    }

    setValue("sameAddress", !sameAddress);

    const firstAddress = getValues("adresses")?.[0];
    setValue("adresses", [
      {
        ...firstAddress,
        adresseComplete: adminAddress.adresseAdministrativeComplete,
        adresse: adminAddress.adresseAdministrative,
        codePostal: adminAddress.codePostalAdministratif,
        commune: adminAddress.communeAdministrative,
        departement: adminAddress.departementAdministratif,
        repartition: watch("typeBati") || Repartition.DIFFUS,
      },
    ]);
  };

  return (
    <div className="w-full">
      <fieldset className="flex flex-col gap-8">
        <div className="flex flex-col gap-6" ref={hebergementsContainerRef}>
          {typeBati === Repartition.COLLECTIF ? (
            <ManualOptionNotices />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ImportOptionNotices typeBati={typeBati} />

              <div className="rounded-lg bg-default-grey-hover p-6 flex flex-col gap-8">
                <div>
                  <h3 className="text-lg text-title-blue-france mb-0">
                    Option 2 - Remplissage manuel
                  </h3>
                  <p className="text-sm text-title-blue-france mb-4">
                    (recommandé si moins de 20 adresses à saisir)
                  </p>
                  <p className="mb-0">
                    Veuillez remplir directement les champs ci-dessous.
                  </p>
                </div>
                <ManualOptionNotices />
              </div>
            </div>
          )}
        </div>

        {typeBati === Repartition.COLLECTIF && (
          <div className="flex mt-6 -mb-4">
            <ToggleSwitch
              inputTitle="Adresse d'hébergement identique"
              label="L'adresse d'hébergement est-elle la même que l'adresse administrative ?"
              labelPosition="left"
              showCheckedHint={false}
              className="w-fit [&_label]:gap-2"
              checked={sameAddress}
              onChange={handleSameAddressChange}
            />
            <p className="pl-2">{sameAddress ? "Oui" : "Non"}</p>
          </div>
        )}

        {((getValues("adresses") || []) as FormAdresse[]).map((_, index) => (
          <div className="flex max-sm:flex-col gap-6" key={`address-${index}`}>
            <AddressWithValidation
              id={`adresses.${index}.adresseComplete`}
              control={control}
              fullAddress={`adresses.${index}.adresseComplete`}
              zipCode={`adresses.${index}.codePostal`}
              street={`adresses.${index}.adresse`}
              department={`adresses.${index}.departement`}
              city={`adresses.${index}.commune`}
              latitude={`adresses.${index}.latitude`}
              longitude={`adresses.${index}.longitude`}
              label="Adresse"
              className="w-1/3"
              disabled={sameAddress}
            />
            <InputWithValidation
              name={`adresses.${index}.adresseTypologies.0.placesAutorisees`}
              id={`adresses.${index}.adresseTypologies.0.placesAutorisees`}
              control={control}
              type="number"
              min={0}
              label="Places"
              className="w-1/12 mb-0"
            />
            <SelectWithValidation
              name={`adresses.${index}.repartition`}
              id={`adresses.${index}.repartition`}
              control={control}
              label="Type de bâti"
              hidden={typeBati !== Repartition.MIXTE}
              required
            >
              <option value="">Sélectionnez une option</option>
              {Object.values(Repartition)
                .filter((repartition) => repartition !== Repartition.MIXTE)
                .map((repartition) => (
                  <option key={repartition} value={repartition}>
                    {repartition}
                  </option>
                ))}
            </SelectWithValidation>
            <div className="flex grow flex-col gap-2">
              <label htmlFor={`adresses.${index}.typologies`}>
                Particularités
              </label>
              <div className="flex w-full gap-4 items-center min-h-[2.6rem]">
                <Controller
                  control={control}
                  name={`adresses.${index}.adresseTypologies.0.logementSocial`}
                  render={({ field }) => (
                    <Checkbox
                      options={[
                        {
                          label: "Logement social",
                          nativeInputProps: {
                            name: field.name,
                            checked: field.value,
                            onChange: field.onChange,
                          },
                        },
                      ]}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`adresses.${index}.adresseTypologies.0.qpv`}
                  render={({ field }) => (
                    <Checkbox
                      options={[
                        {
                          label: "QPV",
                          nativeInputProps: {
                            name: field.name,
                            checked: field.value,
                            onChange: field.onChange,
                          },
                        },
                      ]}
                    />
                  )}
                />

                {index !== 0 && (
                  <Button
                    iconId="fr-icon-delete-line"
                    className="ml-auto rounded-4xl"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveAddress(index);
                    }}
                    priority="tertiary no outline"
                    title="Supprimer l'hébergement"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        {!sameAddress && (
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddAddress();
            }}
            className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2"
          >
            + Ajouter un hébergement
          </button>
        )}
      </fieldset>
    </div>
  );
};

type AdressesListProps = {
  adminAddress: Partial<AdresseAdministrativeFormValues>;
};
