import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { getMillesimendexForAYear } from "@/app/utils/structure.util";
import { CURRENT_YEAR } from "@/constants";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { FormKind } from "@/types/global";

import InputWithValidation from "../../InputWithValidation";

export const FieldSetOuvertureFermeture = ({
  formKind = FormKind.FINALISATION,
}: {
  formKind?: FormKind;
}) => {
  const { control, watch } = useFormContext();

  const structureTypologies: StructureTypologieApiType[] = watch(
    "structureTypologies"
  );
  const currentStructureTypologyIndex = getMillesimendexForAYear(
    structureTypologies,
    CURRENT_YEAR
  );

  if (currentStructureTypologyIndex === -1) {
    return null;
  }

  return (
    <fieldset className="flex flex-col">
      {formKind === FormKind.MODIFICATION && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex  [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
          description="Le nombre de places “QPV” et “Logement social” se modifient dans le bloc “Description”."
        />
      )}
      <h3 className="text-xl font-bold mb-8 text-title-blue-france">
        {formKind === FormKind.FINALISATION ? (
          <>Objectifs d’ouverture et fermeture en {CURRENT_YEAR}</>
        ) : (
          <>Ouvertures et fermetures en {CURRENT_YEAR}</>
        )}
      </h3>
      <p className="mb-2">
        En {CURRENT_YEAR}, sur le nombre total de places autorisées, combien
        restent à créer ? <i>(Indiquez “0” si non prévu)</i>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6 mb-4">
        <InputWithValidation
          name={`structureTypologies[${currentStructureTypologyIndex}].placesACreer`}
          id={`structureTypologies[${currentStructureTypologyIndex}].placesACreer`}
          min={0}
          control={control}
          type="number"
          label="Nombre de places à créer"
        />
        <InputWithValidation
          name={`structureTypologies[${currentStructureTypologyIndex}].echeancePlacesACreer`}
          id={`structureTypologies[${currentStructureTypologyIndex}].echeancePlacesACreer`}
          control={control}
          type="date"
          label="Echéance"
        />
      </div>
      <p className="mb-2">
        En {CURRENT_YEAR}, sur le nombre total de places autorisées, combien
        restent à fermer ? <i>(Indiquez “0” si non prévu)</i>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6">
        <InputWithValidation
          name={`structureTypologies[${currentStructureTypologyIndex}].placesAFermer`}
          id={`structureTypologies[${currentStructureTypologyIndex}].placesAFermer`}
          min={0}
          control={control}
          type="number"
          label="Nombre de places à fermer"
        />
        <InputWithValidation
          name={`structureTypologies[${currentStructureTypologyIndex}].echeancePlacesAFermer`}
          id={`structureTypologies[${currentStructureTypologyIndex}].echeancePlacesAFermer`}
          control={control}
          type="date"
          label="Echéance"
        />
      </div>
    </fieldset>
  );
};
