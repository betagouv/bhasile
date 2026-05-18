import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useEffect, useState } from "react";

import { DepartementAutocomplete } from "@/app/components/forms/autocomplete/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/autocomplete/OperateurAutocomplete";
import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "./StructuresList";

export const StructureSearch = ({
  selectedStructureIds,
  setSelectedStructureIds,
  fixedType,
  multiple = false,
  label,
  operateurName: operateurNameProp,
  setOperateurName: setOperateurNameProp,
  departementNumero: departementNumeroProp,
  setDepartementNumero: setDepartementNumeroProp,
  fixedOperateurName,
  fixedDepartementNumero,
}: Props): ReactElement => {
  const [type, setType] = useState<StructureType | undefined>(fixedType);

  const [operateurNameInternal, setOperateurNameInternal] = useState<
    string | undefined
  >(undefined);
  const [operateurName, setOperateurName] = setOperateurNameProp
    ? [operateurNameProp, setOperateurNameProp]
    : [operateurNameInternal, setOperateurNameInternal];

  const [departementNumeroInternal, setDepartementNumeroInternal] = useState<
    string | undefined
  >(undefined);
  const [departementNumero, setDepartementNumero] = setDepartementNumeroProp
    ? [departementNumeroProp, setDepartementNumeroProp]
    : [departementNumeroInternal, setDepartementNumeroInternal];

  const effectiveOperateurName = fixedOperateurName ?? operateurName;
  const effectiveDepartementNumero =
    fixedDepartementNumero ?? departementNumero;

  const { structures } = useStructuresSelection({
    operateurName: effectiveOperateurName,
    departements: effectiveDepartementNumero,
    types: type !== undefined ? String(type) : undefined,
  });

  useEffect(() => {
    setSelectedStructureIds([]);
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
              value: type ?? "",
              onChange: (event) => {
                setType(
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
  fixedType?: StructureType;
  multiple?: boolean;
  label?: string;
  operateurName?: string;
  setOperateurName?: (operateurName: string | undefined) => void;
  departementNumero?: string;
  setDepartementNumero?: (departementNumero: string | undefined) => void;
  fixedOperateurName?: string;
  fixedDepartementNumero?: string;
};

type Props = StructureSearchProps;
