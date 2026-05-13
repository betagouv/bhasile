import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useState } from "react";

import { DepartementAutocomplete } from "@/app/components/forms/autocomplete/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/autocomplete/OperateurAutocomplete";
import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "./StructuresList";

export const StructureSearch = ({
  selectedStructureIds,
  setSelectedStructuresId,
  fixedType,
  multiple = false,
}: Props): ReactElement => {
  const [type, setType] = useState<StructureType | undefined>(fixedType);
  const [operateurName, setOperateurName] = useState<string | undefined>(
    undefined
  );
  const [departementNumero, setDepartementNumero] = useState<
    string | undefined
  >(undefined);

  const { structures } = useStructuresSelection({
    operateurName,
    departements: departementNumero,
    types: type !== undefined ? String(type) : undefined,
  });

  return (
    <div className="bg-white p-6 rounded-lg mb-2">
      <div className="grid grid-cols-3 gap-6 mb-2">
        {!fixedType && (
          <Select
            label="Type de structure"
            id="type"
            nativeSelectProps={{
              value: type ?? "",
              onChange: (event) => {
                const value = event.target.value;
                setType(value ? (value as StructureType) : undefined);
              },
            }}
          >
            <option value="">Sélectionnez un type</option>
            {Object.values(StructureType)
              .filter((structureType) => structureType !== StructureType.PRAHDA)
              .map((structureTypeOption) => (
                <option key={structureTypeOption} value={structureTypeOption}>
                  {structureTypeOption}
                </option>
              ))}
          </Select>
        )}
        <OperateurAutocomplete
          operateurName={operateurName}
          setOperateurName={setOperateurName}
        />
        <DepartementAutocomplete
          departementNumero={departementNumero}
          setDepartementNumero={setDepartementNumero}
        />
      </div>
      <StructuresList
        structures={structures}
        selectedStructureIds={selectedStructureIds}
        setSelectedStructuresId={setSelectedStructuresId}
        multiple={multiple}
      />
    </div>
  );
};

export type StructureSearchProps = {
  selectedStructureIds: number[];
  setSelectedStructuresId: (structuresId: number[]) => void;
  fixedType?: StructureType;
  multiple?: boolean;
};

type Props = StructureSearchProps;
