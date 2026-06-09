import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useEffect, useRef } from "react";

import { DepartementAutocomplete } from "@/app/components/forms/autocomplete/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/autocomplete/OperateurAutocomplete";
import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "./StructuresList";

export const StructureSearch = ({
  selectedStructureIds,
  setSelectedStructureIds,
  structureType,
  setStructureType,
  multiple = false,
  label,
  operateurName,
  setOperateurName,
  departementNumero,
  setDepartementNumero,
  fixedType,
  fixedOperateurName,
  fixedDepartementNumero,
  finalisedOnly,
}: Props): ReactElement => {
  const effectiveStructureType = fixedType ?? structureType;
  const effectiveOperateurName = fixedOperateurName ?? operateurName;
  const effectiveDepartementNumero =
    fixedDepartementNumero ?? departementNumero;

  const { structures } = useStructuresSelection({
    operateurName: effectiveOperateurName,
    departements: effectiveDepartementNumero,
    types: effectiveStructureType,
    finalisedOnly,
  });

  const prevStructures = useRef<StructureMinimalApiType[] | undefined>(
    undefined
  );
  useEffect(() => {
    if (prevStructures.current !== structures) {
      prevStructures.current = structures;
      setSelectedStructureIds([]);
    }
  }, [structures, setSelectedStructureIds]);

  return (
    <div className="bg-white p-6 rounded-lg mb-2">
      {label && (
        <h3 className="text-base font-bold mb-4 text-title-blue-france">
          {label}
        </h3>
      )}
      <div className="grid grid-cols-3 gap-6 mb-2">
        {!fixedType && (
          <Select
            label="Type de structure"
            id="type"
            nativeSelectProps={{
              value: structureType ?? "",
              onChange: (event) => {
                setStructureType(
                  event.target.value
                    ? (event.target.value as StructureType)
                    : undefined
                );
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
        {!fixedOperateurName && (
          <OperateurAutocomplete
            operateurName={operateurName}
            setOperateurName={setOperateurName}
          />
        )}
        {!fixedDepartementNumero && (
          <DepartementAutocomplete
            departementNumero={departementNumero}
            setDepartementNumero={setDepartementNumero}
          />
        )}
      </div>
      <StructuresList
        structures={structures}
        selectedStructureIds={selectedStructureIds}
        setSelectedStructureIds={setSelectedStructureIds}
        multiple={multiple}
        shouldShowLabel={!label}
      />
    </div>
  );
};

export type StructureSearchProps = {
  selectedStructureIds: number[];
  setSelectedStructureIds: (structuresId: number[]) => void;
  structureType: StructureType | undefined;
  setStructureType: (structureType: StructureType | undefined) => void;
  operateurName: string | undefined;
  setOperateurName: (operateurName: string | undefined) => void;
  departementNumero: string | undefined;
  setDepartementNumero: (departementNumero: string | undefined) => void;
  fixedType?: StructureType;
  multiple?: boolean;
  label?: string;
  fixedOperateurName?: string;
  fixedDepartementNumero?: string;
  finalisedOnly?: boolean;
};

type Props = StructureSearchProps;
