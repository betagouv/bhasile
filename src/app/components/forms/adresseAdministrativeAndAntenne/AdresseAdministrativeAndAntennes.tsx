import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import {
  getTransformationNounAvecArticle,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import { FormKind } from "@/types/global";

import { FieldSetAdresseAdministrative } from "./FieldSetAdresseAdministrative";
import { FieldSetAntennes } from "./FieldSetAntennes";

const ADRESSE_FIELD_NAMES = [
  "nom",
  "adresseAdministrativeComplete",
  "adresseAdministrative",
  "codePostalAdministratif",
  "communeAdministrative",
  "departementAdministratif",
] as const;

type Props = {
  formKind?: FormKind;
};

export const AdresseAdministrativeAndAntennes = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const { watch, setValue, getValues } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const isTransformation = isTransformationSurStructureExistante(formKind);
  const showSitesRadio =
    isTransformation ||
    formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

  const [hasAdresseChanged, setHasAdresseChanged] = useState<
    boolean | undefined
  >(undefined);

  const originalAdresseRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (isTransformation && originalAdresseRef.current === null) {
      originalAdresseRef.current = Object.fromEntries(
        ADRESSE_FIELD_NAMES.map((fieldName) => [fieldName, getValues(fieldName)])
      );
    }
  }, [isTransformation, getValues]);

  const handleDidTransformationChangeAdresse = (changed: boolean) => {
    setHasAdresseChanged(changed);
    ADRESSE_FIELD_NAMES.forEach((fieldName) => {
      if (changed) {
        setValue(fieldName, "");
      } else {
        setValue(fieldName, originalAdresseRef.current?.[fieldName] ?? "");
      }
    });
  };

  const isAdresseLocked = isTransformation && hasAdresseChanged !== true;

  return (
    <>
      {isTransformation ? (
        <div className="flex gap-6">
          <h2
            id="hasAdresseChanged-title"
            className="text-xl font-bold mb-4 text-title-blue-france flex-1"
          >
            {getAdresseChangedQuestion(formKind)}
          </h2>
          <RadioButtons
            aria-labelledby="hasAdresseChanged-title"
            orientation="horizontal"
            name="hasAdresseChanged"
            options={[
              {
                label: "Oui",
                nativeInputProps: {
                  checked: hasAdresseChanged === true,
                  onChange: () => handleDidTransformationChangeAdresse(true),
                },
              },
              {
                label: "Non",
                nativeInputProps: {
                  checked: hasAdresseChanged === false,
                  onChange: () => handleDidTransformationChangeAdresse(false),
                },
              },
            ]}
            className="mr-10"
          />
        </div>
      ) : (
        <h2 className="text-xl font-bold mb-4 text-title-blue-france">
          {getTitle(formKind)}
        </h2>
      )}
      {!showSitesRadio && (
        <>
          <CustomNotice
            severity="info"
            title=""
            description="La structure représente l’ensemble de l’établissement, défini dans les documents de contractualisation et financiers. Il se peut que la structure soit répartie sur plusieurs sites administratifs géographiquement distants. Attention, on ne parle pas ici d’adresses d’hébergement (même dans le cas d’un bâti diffus ou mixte), celles-ci seront demandées à l’étape suivante."
          />
          <Checkbox
            options={[
              {
                label:
                  "La structure est répartie sur plusieurs sites administratifs géographiquement distants.",
                nativeInputProps: {
                  name: "isMultiAntenne",
                  checked: isMultiAntenne,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("isMultiAntenne", event.target.checked);
                  },
                },
              },
            ]}
          />
        </>
      )}
      <FieldSetAdresseAdministrative
        formKind={formKind}
        locked={isAdresseLocked}
      />
      {showSitesRadio && (
        <>
          <hr />
          <div className="flex gap-6">
            <h2
              id="isMultiAntenne-title"
              className="text-xl font-bold mb-4 text-title-blue-france flex-1"
            >
              {getSitesQuestionLabel(formKind)}
            </h2>
            <RadioButtons
              aria-labelledby="isMultiAntenne-title"
              orientation="horizontal"
              name="isMultiAntenne"
              options={[
                {
                  label: "Oui",
                  nativeInputProps: {
                    checked: isMultiAntenne === true,
                    onChange: () => setValue("isMultiAntenne", true),
                  },
                },
                {
                  label: "Non",
                  nativeInputProps: {
                    checked: isMultiAntenne === false,
                    onChange: () => setValue("isMultiAntenne", false),
                  },
                },
              ]}
              className="mr-10"
            />
          </div>
        </>
      )}
      <FieldSetAntennes />
    </>
  );
};

const getTitle = (formKind: FormKind): string => {
  if (formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES) {
    return "Veuillez saisir l’adresse administrative principale de la structure.";
  }
  return "Adresses administratives";
};

const getAdresseChangedQuestion = (formKind: FormKind): string =>
  `Est-ce que le nom d’usage de la structure et/ou son adresse administrative principale changent suite à ${getTransformationNounAvecArticle(
    formKind
  )} ?`;

const getSitesQuestionLabel = (formKind: FormKind): string => {
  if (isTransformationSurStructureExistante(formKind)) {
    return `Est-ce que ${getTransformationNounAvecArticle(
      formKind
    )} modifie la répartition de la structure en plusieurs sites administratifs distants ? Si oui, veuillez nommer chacun des sites.`;
  }
  return "Est-ce que la structure est répartie en plusieurs sites administratifs distants ? Si oui, veuillez nommer chacun des sites.";
};
