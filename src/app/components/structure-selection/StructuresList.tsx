import { Control, FieldValues, useController } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const StructuresList = ({ structures, control }: Props) => {
  const { field } = useController({
    name: "structure",
    control,
  });

  return (
    <div>
      <h3 className="text-base font-bold mb-4 text-title-blue-france">
        {!structures ? "" : "Sélectionnez votre structure"}
      </h3>
      <div className="flex flex-col gap-2 h-80 overflow-y-auto">
        {structures && structures?.length === 0 && (
          <div className="text-sm text-default-grey">
            Aucun résultat ne correspond à votre recherche.
          </div>
        )}
        {structures?.map((structure) => (
          <div key={structure.codeBhasile}>
            <input
              type="radio"
              id={structure.codeBhasile}
              name="structure"
              value={structure.codeBhasile}
              checked={field.value?.codeBhasile === structure.codeBhasile}
              onChange={() => {
                field.onChange(structure);
              }}
              onClick={() => {
                if (structure.codeBhasile === field.value?.codeBhasile) {
                  field.onChange(undefined);
                }
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              className="sr-only"
            />
            <label
              className={cn(
                "p-4 rounded-sm border-2 flex gap-4 relative bg-default-grey-hover",
                field.value?.codeBhasile === structure.codeBhasile
                  ? "border-action-high-blue-france"
                  : "border-white"
              )}
              htmlFor={structure.codeBhasile}
            >
              <span className="fr-icon-community-line fr-icon--md text-title-blue-france" />
              <div>
                <strong className="uppercase font-bold text-title-blue-france">
                  {structure.nom}
                </strong>
                <div className="text-sm ">
                  {structure.codeBhasile} - {structure.type},{" "}
                  {structure.operateur.name},{" "}
                  {structure.departementAdministratif}
                </div>
              </div>
              {field.value?.codeBhasile === structure.codeBhasile && (
                <span className="absolute right-6 top-1/2 -translate-y-1/2 fr-icon-check-line fr-icon--md text-title-blue-france" />
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {
  structures: StructureMinimalApiType[] | undefined;
  control: Control<FieldValues>;
};
