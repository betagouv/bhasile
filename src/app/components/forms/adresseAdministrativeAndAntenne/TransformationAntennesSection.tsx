import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { getTransformationNounAvecArticle } from "@/app/utils/transformation.util";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { FormKind } from "@/types/global";

import { emptyAntenne, FieldSetAntennes } from "./FieldSetAntennes";

const antennesSignature = (antennes: AntenneFormValues[]): string =>
  antennes
    .map((antenne) =>
      [
        antenne.name ?? "",
        antenne.adresse ?? "",
        antenne.codePostal ?? "",
        antenne.commune ?? "",
        antenne.departement ?? "",
      ].join("|")
    )
    .join("§");

type Props = {
  formKind: FormKind;
  originalAntennes: AntenneFormValues[];
};

export const TransformationAntennesSection = ({
  formKind,
  originalAntennes,
}: Props) => {
  const { watch, getValues, setValue } = useFormContext();

  const antennes = (watch("antennes") || []) as AntenneFormValues[];
  const antennesLength = antennes.length;

  const [hasRepartitionChanged, setHasRepartitionChanged] = useState<boolean>(
    () =>
      antennesSignature(
        (getValues("antennes") ?? []) as AntenneFormValues[]
      ) !== antennesSignature(originalAntennes)
  );

  useEffect(() => {
    setValue("isMultiAntenne", antennesLength > 0);
  }, [antennesLength, setValue]);

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
  )} change la situation indiquée ci-dessous concernant la répartition de la structure en plusieurs sites administratifs ? Si oui, veuillez bien nommer chacun des sites.`;

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
      {antennesLength > 0 && (
        <FieldSetAntennes locked={!hasRepartitionChanged} showTitle={false} />
      )}
      {antennesLength === 0 && !hasRepartitionChanged && (
        <p className="text-sm text-mention-grey italic">
          La structure n’est pas répartie en plusieurs sites administratifs.
        </p>
      )}
    </>
  );
};
