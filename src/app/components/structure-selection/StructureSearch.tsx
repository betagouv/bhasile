import { ReactElement, useState } from "react";

import { DepartementAutocomplete } from "@/app/components/forms/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "./StructuresList";
import Select from "@codegouvfr/react-dsfr/Select";
import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";

export const StructureSearch = ({selectedStructuresId, setSelectedStructuresId, fixedType}: Props): ReactElement => {
  const [type, setType] = useState<StructureType | undefined>(fixedType);
  const [operateurName, setOperateurName] = useState<string | undefined>(undefined);
  const [departementNumero, setDepartementNumero] = useState<string | undefined>(undefined);

  const { structures } = useStructuresSelection({
    operateurName,
    departements: departementNumero,
    types: type,
  });

  return (
    <div className="bg-white p-6 rounded-lg mb-2">
      <div className="grid grid-cols-3 gap-6 mb-2">
        {!fixedType &&<Select
          label="Type de structure"
          id="type"
          nativeSelectProps={{
            value: type,
            onChange: (event) => setType(event.target.value as StructureType),
          }}
        >
          <option value="">Sélectionnez un type</option>
          {Object.values(StructureType)
            .filter((structureType) => structureType !== StructureType.PRAHDA)
            .map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </Select>
        )}
        <OperateurAutocomplete operateurName={operateurName} setOperateurName={setOperateurName} />
        <DepartementAutocomplete departementNumero={departementNumero} setDepartementNumero={setDepartementNumero} />
      </div>
      <StructuresList structures={structures} selectedStructuresId={selectedStructuresId} setSelectedStructuresId={setSelectedStructuresId} />
    </div>
  );
};

type Props = {
  selectedStructuresId: number[];
  setSelectedStructuresId: (structuresId: number[]) => void;
  fixedType?: StructureType;
};