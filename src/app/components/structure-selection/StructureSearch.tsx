import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useEffect, useRef } from "react";

import { DepartementAutocomplete } from "@/app/components/forms/autocomplete/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/autocomplete/OperateurAutocomplete";
import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import {
  ACCEPTED_STRUCTURE_TYPES,
  StructureType,
} from "@/types/structure.type";

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
  finalisedOnly,
  excludedStructureId,
  idPrefix,
}: Props): ReactElement => {
  const effectiveStructureType = fixedType ?? structureType;

  const { structures } = useStructuresSelection({
    operateurName,
    departements: departementNumero,
    types: effectiveStructureType,
    finalisedOnly,
  });

  const visibleStructures = structures?.filter(
    (structure) => structure.id !== excludedStructureId
  );

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
        <h3 className="text-base font-bold text-title-blue-france mb-4">
          {label}
        </h3>
      )}
      <div className="grid grid-cols-3 gap-6 mb-2">
        {!fixedType && (
          <Select
            label="Type de structure"
            id={buildId(idPrefix, "type")}
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
            {ACCEPTED_STRUCTURE_TYPES.map((structureTypeOption) => (
              <option key={structureTypeOption} value={structureTypeOption}>
                {structureTypeOption}
              </option>
            ))}
          </Select>
        )}
        <OperateurAutocomplete
          id={buildId(idPrefix, "operateur")}
          operateurName={operateurName}
          setOperateurName={setOperateurName}
        />
        <DepartementAutocomplete
          id={buildId(idPrefix, "departement")}
          departementNumero={departementNumero}
          setDepartementNumero={setDepartementNumero}
        />
      </div>
      <StructuresList
        structures={visibleStructures}
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
  finalisedOnly?: boolean;
  excludedStructureId?: number;
  idPrefix?: string;
};

type Props = StructureSearchProps;

const buildId = (idPrefix: string | undefined, field: string): string =>
  idPrefix ? `${idPrefix}-${field}` : field;
