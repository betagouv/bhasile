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
  operateurName: operateurNameProp,
  setOperateurName: setOperateurNameProp,
  departementNumero: departementNumeroProp,
  setDepartementNumero: setDepartementNumeroProp,
  fixedOperatorName,
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

  const effectiveOperateurName = fixedOperatorName ?? operateurName;
  const effectiveDepartementNumero =
    fixedDepartementNumero ?? departementNumero;

  const { structures } = useStructuresSelection({
    operateurName: effectiveOperateurName,
    departements: effectiveDepartementNumero,
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
        {!fixedOperatorName && (
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
  operateurName?: string;
  setOperateurName?: (operateurName: string | undefined) => void;
  departementNumero?: string;
  setDepartementNumero?: (departementNumero: string | undefined) => void;
  fixedOperatorName?: string;
  fixedDepartementNumero?: string;
};

type Props = StructureSearchProps;
