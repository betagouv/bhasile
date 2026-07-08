import { useFormContext, useWatch } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import {
  getTransformationNounAvecArticle,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import {
  getPlacesDirection,
  getPlacesDirectionMessage,
} from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { FormKind } from "@/types/global";

type Props = {
  formKind?: FormKind;
  originalPlaces?: number;
};

export const FieldSetTransformationPlaces = ({
  formKind = FormKind.FINALISATION,
  originalPlaces,
}: Props) => {
  const { control, register } = useFormContext();

  const rawPlaces = useWatch({
    control,
    name: "structureTypologies.0.placesAutorisees",
  });
  const placesAutorisees =
    rawPlaces === "" || rawPlaces === undefined || rawPlaces === null
      ? undefined
      : Number(rawPlaces);
  const totalPlaces = placesAutorisees ?? 0;

  const direction =
    originalPlaces !== undefined
      ? getPlacesDirection(formKind, originalPlaces, placesAutorisees)
      : "valid";
  const isContradiction = direction === "contradiction";

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france max-w-3xl">
        {getLegend(formKind)}
      </legend>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-1">
          <InputWithValidation
            name="structureTypologies.0.placesAutorisees"
            id="structureTypologies.0.placesAutorisees"
            control={control}
            type="number"
            min={0}
            label="Nombre total de places autorisées"
            className="mb-0"
            state={isContradiction ? "error" : undefined}
            stateRelatedMessage={
              isContradiction && originalPlaces !== undefined
                ? getPlacesDirectionMessage(formKind, originalPlaces)
                : undefined
            }
          />
          {originalPlaces !== undefined && !isContradiction && (
            <p className="flex items-center gap-1 mt-1 text-sm text-action-high-blue-france">
              <span
                className="fr-icon-information-line fr-icon--sm"
                aria-hidden="true"
              />
              {getPlacesDiffMessage(formKind, originalPlaces, totalPlaces)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="structureTypologies.0.pmr"
          id="structureTypologies.0.pmr"
          control={control}
          type="number"
          min={0}
          label="Nombre de places PMR*"
          hintText="*Personnes à Mobilité Réduite"
        />
        <InputWithValidation
          name="structureTypologies.0.lgbt"
          id="structureTypologies.0.lgbt"
          control={control}
          type="number"
          min={0}
          label="Nombre de places LGBT* (labellisées)"
          hintText="*Lesbiennes, Gays, Bisexuels et Transgenres"
        />
        <InputWithValidation
          name="structureTypologies.0.fvvTeh"
          id="structureTypologies.0.fvvTeh"
          control={control}
          type="number"
          min={0}
          label="Nombre de places FVV/TEH* (spécialisées)"
          hintText="*Femmes Victimes de Violences/Traîte des Êtres Humains"
        />
      </div>

      <input
        aria-hidden="true"
        type="hidden"
        {...register("structureTypologies.0.year")}
      />
    </fieldset>
  );
};

const getLegend = (formKind: FormKind): string => {
  if (isTransformationSurStructureExistante(formKind)) {
    return `Veuillez renseigner les nombres de places suivants à la suite de ${getTransformationNounAvecArticle(
      formKind
    )}, tels que prévu dans la nouvelle convention.`;
  }
  return "Types de place (tels que prévus dans la convention)";
};

const getPlacesDiffMessage = (
  formKind: FormKind,
  originalPlaces: number,
  totalPlaces: number
): string => {
  if (formKind === FormKind.CONTRACTION) {
    return `soit ${originalPlaces - totalPlaces} place(s) en moins`;
  }
  return `soit ${totalPlaces - originalPlaces} nouvelle(s) place(s)`;
};
