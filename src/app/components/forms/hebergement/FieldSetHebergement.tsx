import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import { useCallback, useEffect, useRef } from "react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";

import { isAdresseEmpty } from "@/app/utils/adresse.util";
import {
  getTransformationNounAvecArticle,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import { CURRENT_YEAR } from "@/constants";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { AdresseComponent } from "./Adresse";
import { Notices } from "./Notices";

const MIN_ADRESSES = 1;

export const FieldSetHebergement = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { control, setValue, watch, getValues, setError } =
    parentFormContext || localForm;

  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "adresses",
  });

  const id = watch("id");
  const selectedTypeBati = watch("typeBati");
  const typeBati = selectedTypeBati || Repartition.DIFFUS;
  const adminAdresse = watch("adresseAdministrativeComplete");
  const sameAddress = watch("sameAddress");
  const watchedAdresses = (watch("adresses") || []) as FormAdresse[];

  const createEmptyAdresse = useCallback(
    (): FormAdresse => ({
      structureId: id,
      adresseComplete: "",
      adresse: "",
      codePostal: "",
      commune: "",
      departement: "",
      repartition:
        typeBati === Repartition.MIXTE ? Repartition.DIFFUS : typeBati,
      adresseTypologies: [
        {
          placesAutorisees: null,
          year: CURRENT_YEAR,
          logementSocial: false,
          qpv: false,
        },
      ],
    }),
    [id, typeBati]
  );

  useEffect(() => {
    if (selectedTypeBati && fields.length === 0) {
      append(createEmptyAdresse(), { shouldFocus: false });
    }
  }, [selectedTypeBati, fields.length, append, createEmptyAdresse]);

  const hebergementsContainerRef = useRef(null);

  useEffect(() => {
    if (hebergementsContainerRef.current) {
      autoAnimate(hebergementsContainerRef.current);
    }
  }, [hebergementsContainerRef]);

  const handleAddAdresse = () => {
    append(createEmptyAdresse(), { shouldFocus: false });
  };

  const handleRemoveAdresse = (index: number) => {
    if (fields.length > MIN_ADRESSES) {
      remove(index);
      return;
    }
    update(index, createEmptyAdresse());
  };

  const handleSameAddressChange = () => {
    if (!sameAddress && (adminAdresse === "" || adminAdresse === undefined)) {
      const adminAdresseElement = document.getElementById(
        "adresseAdministrativeComplete"
      );
      if (adminAdresseElement) {
        adminAdresseElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setTimeout(() => {
          adminAdresseElement.focus();

          setError("adresseAdministrativeComplete", {
            type: "manual",
            message: "Veuillez renseigner l'adresse administrative.",
          });
        }, 100);
      }
    }

    setValue("sameAddress", !sameAddress);

    const firstAdresse = getValues("adresses")?.[0];
    replace([
      {
        ...firstAdresse,
        adresseComplete: adminAdresse,
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

  // Listen to typeBati and set every adresse repartition to the typeBati (if typeBati is not MIXTE).
  useEffect(() => {
    if (typeBati !== Repartition.MIXTE) {
      const currentAdresses = (getValues("adresses") || []) as FormAdresse[];
      currentAdresses.forEach((adresse, index) => {
        if (adresse.repartition !== typeBati) {
          setValue(`adresses.${index}.repartition`, typeBati as Repartition, {
            shouldValidate: false,
          });
        }
      });
    }
  }, [typeBati, getValues, setValue]);

  return (
    <div>
      {isTransformationSurStructureExistante(formKind) && (
        <h2 className="text-xl font-bold mb-4 text-title-blue-france max-w-3xl">
          {`Veuillez conserver uniquement les adresses d’hébergement qui composent l’ensemble de la structure une fois ${getTransformationNounAvecArticle(
            formKind
          )} effective et actualiser le nombre de place attribué à chacune d’entre elles ainsi que leurs particularités.`}
        </h2>
      )}
      <fieldset className="flex flex-col gap-6">
        {!isTransformationSurStructureExistante(formKind) && (
          <Notices
            typeBati={typeBati}
            hebergementsContainerRef={hebergementsContainerRef}
            formKind={formKind}
          />
        )}

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
        {fields.map((field, index) => {
          const adresse =
            (watchedAdresses[index] as FormAdresse | undefined) ??
            (field as unknown as FormAdresse);
          const canDelete =
            !sameAddress &&
            (fields.length > MIN_ADRESSES || !isAdresseEmpty(adresse));
          return (
            <AdresseComponent
              key={field.id}
              index={index}
              control={control}
              sameAddress={sameAddress}
              handleRemoveAdresse={canDelete ? handleRemoveAdresse : undefined}
              typeBati={typeBati}
            />
          );
        })}
        {selectedTypeBati && !sameAddress && (
          <button
            onClick={(event) => {
              event.preventDefault();
              handleAddAdresse();
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
