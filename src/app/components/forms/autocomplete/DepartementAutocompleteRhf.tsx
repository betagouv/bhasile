"use client";

import { ReactElement, useEffect, useState } from "react";
import { useController } from "react-hook-form";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";
import { normalizeAccents } from "@/app/utils/string.util";
import { DEPARTEMENTS } from "@/constants";

import { AutocompleteField } from "./AutocompleteField";

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

export type DepartementAutocompleteProps = {
  departementNumero?: string | undefined;
  setDepartementNumero?: (numero: string | undefined) => void;
};

export const DepartementAutocomplete = (
  props: DepartementAutocompleteProps = {}
): ReactElement => {
  if (props.setDepartementNumero) {
    return (
      <DepartementAutocompleteWithNumero
        numero={props.departementNumero}
        setNumero={props.setDepartementNumero}
      />
    );
  }
  return <DepartementAutocompleteRhf />;
};

const DepartementAutocompleteWithNumero = ({
  numero,
  setNumero,
  externalInvalid,
  externalError,
  inputRef,
  onBlurExtra,
}: {
  numero: string | undefined;
  setNumero: (numero: string | undefined) => void;
  externalInvalid?: boolean;
  externalError?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onBlurExtra?: () => void;
}): ReactElement => {
  const [label, setLabel] = useState(() => labelForNumero(numero));

  useEffect(() => {
    if (numero) {
      setLabel(labelForNumero(numero));
    }
  }, [numero]);

  return (
    <AutocompleteField
      {...LABELS}
      name="departement.numero"
      value={label}
      inputRef={inputRef}
      onBlurExtra={onBlurExtra}
      onValueChange={(next) => {
        setLabel(next);
        if (!next || labelForNumero(numero) !== next) {
          setNumero(undefined);
        }
      }}
      onSelect={(s) => {
        setLabel(s.label);
        setNumero(s.id);
      }}
      onClear={() => setNumero(undefined)}
      fetchSuggestions={fetchSuggestions}
      externalInvalid={externalInvalid}
      externalError={externalError}
    />
  );
};

const DepartementAutocompleteRhf = (): ReactElement => {
  const { field, fieldState } = useController({
    name: "departement.numero",
    rules: { required: true },
  });

  return (
    <DepartementAutocompleteWithNumero
      numero={field.value as string | undefined}
      setNumero={field.onChange}
      inputRef={field.ref}
      onBlurExtra={field.onBlur}
      externalInvalid={fieldState.invalid}
      externalError={fieldState.error?.message}
    />
  );
};
