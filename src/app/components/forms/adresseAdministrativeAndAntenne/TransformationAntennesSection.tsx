import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { getTransformationNounAvecArticle } from "@/app/utils/transformation.util";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { FormKind } from "@/types/global";

import { emptyAntenne, FieldSetAntennes } from "./FieldSetAntennes";

type Props = {
  formKind: FormKind;
};

export const TransformationAntennesSection = ({ formKind }: Props) => {
  const { watch, getValues, setValue } = useFormContext();

  const antennes = (watch("antennes") || []) as AntenneFormValues[];
  const isMultiAntenne = watch("isMultiAntenne");
  const antennesLength = antennes.length;

  const [hasRepartitionChanged, setHasRepartitionChanged] = useState<
    boolean | undefined
  >(undefined);
  const [originalAntennes] = useState<AntenneFormValues[]>(() =>
    structuredClone((getValues("antennes") ?? []) as AntenneFormValues[])
  );

  useEffect(() => {
    const nextIsMultiAntenne = antennesLength > 0;
    if (isMultiAntenne !== nextIsMultiAntenne) {
      setValue("isMultiAntenne", nextIsMultiAntenne);
    }
  }, [antennesLength, isMultiAntenne, setValue]);

  const handleAnswer = (modifiesRepartition: boolean) => {
    setHasRepartitionChanged(modifiesRepartition);
    if (modifiesRepartition) {
      const currentAntennes = (getValues("antennes") ??
        []) as AntenneFormValues[];
      if (currentAntennes.length === 0) {
        setValue("antennes", [emptyAntenne, emptyAntenne]);
      }
      return;
    }
    setValue("antennes", structuredClone(originalAntennes));
  };

  const title = `Est-ce que ${getTransformationNounAvecArticle(
    formKind
  )} modifie la répartition de la structure en plusieurs sites administratifs distants ? Si oui, veuillez nommer chacun des sites.`;

  return (
    <>
      <hr />
      <div className="flex gap-6">
        <h2
          id="hasRepartitionChanged-title"
          className="text-xl font-bold mb-4 text-title-blue-france flex-1"
        >
          {title}
        </h2>
        <RadioButtons
          aria-labelledby="hasRepartitionChanged-title"
          orientation="horizontal"
          name="hasRepartitionChanged"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                checked: hasRepartitionChanged === true,
                onChange: () => handleAnswer(true),
              },
            },
            {
              label: "Non",
              nativeInputProps: {
                checked: hasRepartitionChanged === false,
                onChange: () => handleAnswer(false),
              },
            },
          ]}
          className="mr-10"
        />
      </div>
      {hasRepartitionChanged === true && <FieldSetAntennes />}
    </>
  );
};
