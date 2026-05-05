"use client";

import { ReactElement, Ref, useEffect, useState } from "react";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";
import { normalizeAccents } from "@/app/utils/string.util";
import { DEPARTEMENTS } from "@/constants";

import { AutocompleteField } from "./AutocompleteField";

export const DepartementAutocomplete = ({
  departementNumero,
  setDepartementNumero,
  externalInvalid,
  externalError,
  inputRef,
  onBlurExtra,
}: Props): ReactElement => {
  const [label, setLabel] = useState(() => labelForNumero(departementNumero));

  useEffect(() => {
    if (departementNumero) {
      setLabel(labelForNumero(departementNumero));
    }
  }, [departementNumero]);

  return (
    <AutocompleteField
      {...LABELS}
      name="departement.numero"
      value={label}
      inputRef={inputRef}
      onBlurExtra={onBlurExtra}
      onValueChange={(next) => {
        setLabel(next);
        if (!next || labelForNumero(departementNumero) !== next) {
          setDepartementNumero(undefined);
        }
      }}
      onSelect={(s) => {
        setLabel(s.label);
        setDepartementNumero(s.id);
      }}
      onClear={() => setDepartementNumero(undefined)}
      fetchSuggestions={fetchSuggestions}
      externalInvalid={externalInvalid}
      externalError={externalError}
    />
  );
};

type Props = {
  departementNumero: string | undefined;
  setDepartementNumero: (numero: string | undefined) => void;
  externalInvalid?: boolean;
  externalError?: string;
  inputRef?: Ref<HTMLInputElement>;
  onBlurExtra?: () => void;
};

const fetchSuggestions = async (
  searchTerm: string
): Promise<AutocompleteSuggestion[]> =>
  DEPARTEMENTS.filter(
    (d) =>
      normalizeAccents(d.name).includes(normalizeAccents(searchTerm)) ||
      d.numero.includes(searchTerm)
  ).map((d) => ({ id: d.numero, label: d.name, key: d.numero }));

const labelForNumero = (numero: string | undefined) =>
  numero ? (DEPARTEMENTS.find((d) => d.numero === numero)?.name ?? "") : "";

const LABELS = {
  id: "departement",
  label: "Département",
  notSelectedError:
    "Veuillez sélectionner un département dans la liste déroulante",
  emptyMessage: "Continuez à saisir le nom du département",
  debounceMs: 0,
  searchTermLength: 2,
};
