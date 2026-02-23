import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import { useEffect, useRef } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { CURRENT_YEAR } from "@/constants";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { AdresseComponent } from "./fieldSetHebergement/Adresse";
import { Notices } from "./fieldSetHebergement/Notices";

export const FieldSetHebergement = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { control, setValue, watch, getValues, setError } =
    parentFormContext || localForm;

  const dnaCode = watch("dnaCode");
  const typeBati = watch("typeBati") || Repartition.DIFFUS;
  const adminAddress = watch("adresseAdministrativeComplete");
  const sameAddress = watch("sameAddress");

  const adresses = (watch("adresses") || []) as FormAdresse[];

  const hebergementsContainerRef = useRef(null);

  useEffect(() => {
    if (hebergementsContainerRef.current) {
      autoAnimate(hebergementsContainerRef.current);
    }
  }, [hebergementsContainerRef]);

  const handleAddAddress = () => {
    const newAddress: FormAdresse = {
      structureDnaCode: dnaCode,
      adresseComplete: "",
      adresse: "",
      codePostal: "",
      commune: "",
      departement: "",
      repartition: Repartition.DIFFUS,
      adresseTypologies: [
        {
          placesAutorisees: undefined as number | undefined,
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

  // Listen to typeBati and set sameAddress to false if not COLLECTIF
  useEffect(() => {
    if (typeBati !== Repartition.COLLECTIF && sameAddress) {
      setValue("sameAddress", false);
    }
  }, [typeBati, sameAddress, setValue]);

  // Listen to typeBati and set every adresse repartition to the typeBati (if typeBat is not MIXTE)
  useEffect(() => {
    if (typeBati !== Repartition.MIXTE) {
      const currentAdresses: FormAdresse[] = getValues("adresses") || [];
      const updatedAdresses = currentAdresses.map((adresse) => ({
        ...adresse,
        repartition: typeBati as Repartition,
      }));
      setValue("adresses", updatedAdresses, {
        shouldValidate: false,
      });
    }
  }, [typeBati, getValues, setValue]);

  // Listen to typeBati and keep only one adresse if typeBati is COLLECTIF
  useEffect(() => {
    if (typeBati === Repartition.COLLECTIF) {
      const currentAdresses: FormAdresse[] = getValues("adresses") || [];
      const updatedAdresses = currentAdresses.slice(0, 1);
      setValue("adresses", updatedAdresses, {
        shouldValidate: false,
      });
    }
  }, [typeBati, getValues, setValue]);

  return (
    <div>
      <fieldset className="flex flex-col gap-6">
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          Hébergements
        </legend>

        <Notices
          typeBati={typeBati}
          hebergementsContainerRef={hebergementsContainerRef}
        />

        {typeBati === Repartition.COLLECTIF &&
          formKind !== FormKind.ADRESSES_RECOVERY && (
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

        {adresses.map((_, index) => (
          <AdresseComponent
            key={index}
            index={index}
            control={control}
            sameAddress={sameAddress}
            handleRemoveAddress={handleRemoveAddress}
            typeBati={typeBati}
          />
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

type Props = {
  formKind?: FormKind;
};
