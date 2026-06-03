import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import {
  getTransformationNounAvecArticle,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import { FormKind } from "@/types/global";

import { FieldSetAdresseAdministrative } from "./FieldSetAdresseAdministrative";
import { FieldSetAntennes } from "./FieldSetAntennes";

type Props = {
  formKind?: FormKind;
};

export const AdresseAdministrativeAndAntennes = ({
  formKind = FormKind.FINALISATION,
}: Props) => {
  const { watch, setValue } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const showSitesRadio =
    isTransformationSurStructureExistante(formKind) ||
    formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

  const title = getTitle(formKind);
  const sitesQuestionLabel = getSitesQuestionLabel(formKind);

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        {title}
      </h2>
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
      <FieldSetAdresseAdministrative formKind={formKind} />
      {showSitesRadio && (
        <>
          <hr />
          <div className="flex gap-6">
            <h2
              id="isMultiAntenne-title"
              className="text-xl font-bold mb-4 text-title-blue-france flex-1"
            >
              {sitesQuestionLabel}
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
  if (isTransformationSurStructureExistante(formKind)) {
    return `Veuillez saisir l’adresse administrative principale de la structure suite à ${getTransformationNounAvecArticle(
      formKind
    )}.`;
  }
  if (formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES) {
    return "Veuillez saisir l’adresse administrative principale de la structure.";
  }
  return "Adresses administratives";
};

const getSitesQuestionLabel = (formKind: FormKind): string => {
  if (isTransformationSurStructureExistante(formKind)) {
    return `Est-ce que ${getTransformationNounAvecArticle(
      formKind
    )} modifie la répartition de la structure en plusieurs sites administratifs distants ? Si oui, veuillez nommer chacun des sites.`;
  }
  return "Est-ce que la structure est répartie en plusieurs sites administratifs distants ? Si oui, veuillez nommer chacun des sites.";
};
