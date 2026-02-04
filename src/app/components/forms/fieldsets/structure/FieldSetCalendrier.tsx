import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import { StructureType } from "@/types/structure.type";

import { ContractualisationHuda } from "../../ContractualisationHuda";
import InputWithValidation from "../../InputWithValidation";

export const FieldSetCalendrier = () => {
  const { control, watch } = useFormContext();
  const type = watch("type");
  const cpom = watch("cpom");

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Calendrier
      </h2>
      {isStructureAutorisee(type) && (
        <fieldset className="flex flex-col gap-6">
          <legend className="text-lg font-bold mb-2 text-title-blue-france">
            Période d’autorisation en cours
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6">
            <InputWithValidation
              name="debutPeriodeAutorisation"
              id="debutPeriodeAutorisation"
              control={control}
              type="date"
              label="Date de début"
            />

            <InputWithValidation
              name="finPeriodeAutorisation"
              id="finPeriodeAutorisation"
              control={control}
              type="date"
              label="Date de fin"
            />
          </div>
        </fieldset>
      )}
      {type === StructureType.HUDA && <ContractualisationHuda />}
      <fieldset className="flex flex-col gap-6">
        <legend className="text-lg font-bold mb-2 text-title-blue-france">
          Convention en cours
          {isStructureAutorisee(type) ? " (optionnel)" : ""}
        </legend>
        {isStructureAutorisee(type) && (
          <Notice
            severity="info"
            title=""
            className="rounded [&_p]:flex  [&_p]:items-center max-w-lg"
            description="Uniquement si votre structure est sous convention."
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6">
          <InputWithValidation
            name="debutConvention"
            id="debutConvention"
            control={control}
            type="date"
            label="Date de début"
          />

          <InputWithValidation
            name="finConvention"
            id="finConvention"
            control={control}
            type="date"
            label="Date de fin"
          />
        </div>
      </fieldset>
    </div>
  );
};
