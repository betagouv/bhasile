import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Controller, UseFormSetError } from "react-hook-form";
import {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { AdressImporter } from "@/app/components/forms/address/AdressImporter";
import AddressWithValidation from "@/app/components/forms/AddressWithValidation";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import {
  CURRENT_YEAR,
  MODELE_DIFFUS_LINK,
  MODELE_MIXTE_LINK,
} from "@/constants";
import { AjoutAdressesFormValues } from "@/schemas/forms/ajout/ajoutAdresses.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

interface AdressesListProps {
  watch: UseFormWatch<AjoutAdressesFormValues>;
  control: Control<AjoutAdressesFormValues>;
  setValue: UseFormSetValue<AjoutAdressesFormValues>;
  getValues: UseFormGetValues<AjoutAdressesFormValues>;
  setError: UseFormSetError<AjoutAdressesFormValues>;
}

export const AdressesList = ({
  watch,
  control,
  setValue,
  getValues,
  setError,
}: AdressesListProps) => {
  const typeBati = watch("typeBati") || Repartition.DIFFUS;
  const adminAddress = watch("adresseAdministrativeComplete");
  const sameAddress = watch("sameAddress");

  const hebergementsContainerRef = useRef(null);

  useEffect(() => {
    if (hebergementsContainerRef.current) {
      autoAnimate(hebergementsContainerRef.current);
    }
  }, [hebergementsContainerRef]);

  const handleAddAddress = () => {
    const newAddress: FormAdresse = {
      structureDnaCode: undefined,
      adresseComplete: "",
      adresse: "",
      codePostal: "",
      commune: "",
      departement: "",
      repartition: Repartition.DIFFUS,
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
    if (!sameAddress && (adminAddress === "" || adminAddress === undefined)) {
      const adminAddressElement = document.getElementById(
        "adresseAdministrativeComplete"
      );
      if (adminAddressElement) {
        adminAddressElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setTimeout(() => {
          adminAddressElement.focus();

          setError("adresseAdministrativeComplete", {
            type: "manual",
            message: "Veuillez renseigner l'adresse administrative.",
          });
        }, 100);
      }
    }

    setValue("sameAddress", !sameAddress);

    const firstAddress = getValues("adresses")?.[0];
    setValue("adresses", [
      {
        ...firstAddress,
        adresseComplete: adminAddress,
        adresse: watch("adresseAdministrative"),
        codePostal: watch("codePostalAdministratif"),
        commune: watch("communeAdministrative"),
        repartition: watch("typeBati") || Repartition.DIFFUS,
      },
    ]);
  };

  return (
    <div>
      <hr />
      <fieldset className="flex flex-col gap-6">
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          Hébergements
        </legend>
        <div className="flex flex-col gap-2" ref={hebergementsContainerRef}>
          {typeBati === Repartition.COLLECTIF ? (
            <p className="mb-6">
              Veuillez renseigner l’ensemble des adresses d’hébergement de la
              structure, et les informations associées, au 1er janvier de
              l’année en cours.
            </p>
          ) : (
            <>
              <p className="mb-1">
                Veuillez renseigner l’ensemble des adresses d’hébergement de la
                structure, et les informations associées, au 1er janvier de
                l’année en cours. <br />
                Vous pouvez le faire directement en remplissant les champs
                ci-dessous ou vous pouvez compléter{" "}
                <Link
                  href={
                    typeBati === Repartition.DIFFUS
                      ? MODELE_DIFFUS_LINK
                      : MODELE_MIXTE_LINK
                  }
                  className="underline text-title-blue-france"
                >
                  notre modèle à télécharger
                </Link>{" "}
                depuis un logiciel tableur, l’importer puis vérifier le
                remplissage automatique des champs qui s’opérera.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-action-high-blue-france font-bold mb-0">
                  Liste des hébergements (d’après notre modèle à télécharger
                  uniquement)
                </p>
                <p className="text-disabled-grey mb-0 text-xs col-span-3">
                  Taille maximale par fichier : 10 Mo. Formats supportés : xls,
                  xlsx, et csv.
                </p>
                <AdressImporter
                  getValues={getValues}
                  setValue={setValue}
                  typeBati={typeBati}
                />
              </div>
            </>
          )}
        </div>
        <Notice
          severity="info"
          title="Pour le champ “places”,"
          description="veuillez renseigner le nombre total de places autorisées pour l’adresse correspondante."
        />
        <Notice
          severity="info"
          title=""
          description={
            <>
              Concernant les particularités, les logements sociaux correspondent
              aux logement loués à un bailleur social. Vous pouvez vérifier si
              une adresse est dans un Quartier Prioritaire de la politique de la
              Ville (QPV){" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://sig.ville.gouv.fr/"
                className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2"
              >
                sur ce lien
              </a>
              . Si une adresse ne donne pas de résultat, veuillez laisser la
              case décochée.
            </>
          }
        />

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

                {index !== 0 && typeBati !== Repartition.COLLECTIF && (
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
        {typeBati !== Repartition.COLLECTIF && (
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
