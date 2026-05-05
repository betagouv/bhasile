"use client";

import { ReactElement, Ref } from "react";

import { useOperateurSuggestion } from "@/app/hooks/useOperateurSuggestion";

import { AutocompleteField } from "./AutocompleteField";

export const OperateurAutocomplete = ({
  operateurName,
  setOperateurName,
  setOperateurId,
  externalInvalid,
  externalError,
  inputRef,
  onBlurExtra,
}: Props): ReactElement => {
  const fetchSuggestions = useOperateurSuggestion();

  return (
    <AutocompleteField
      {...LABELS}
      name="operateur.name"
      value={operateurName ?? ""}
      inputRef={inputRef}
      onBlurExtra={onBlurExtra}
      onValueChange={(next) => setOperateurName(next || undefined)}
      onSelect={(suggestion) => {
        setOperateurName(suggestion.label);
        const id = Number(suggestion.id);
        if (!Number.isNaN(id)) {
          setOperateurId?.(id);
        }
      }}
      onClear={() => setOperateurId?.(undefined)}
      fetchSuggestions={fetchSuggestions}
      externalInvalid={externalInvalid}
      externalError={externalError}
    />
  );
};

type Props = {
  operateurName: string | undefined;
  setOperateurName: (name: string | undefined) => void;
  setOperateurId?: (id: number | undefined) => void;
  externalInvalid?: boolean;
  externalError?: string;
  inputRef?: Ref<HTMLInputElement>;
  onBlurExtra?: () => void;
};

const LABELS = {
  id: "operateur",
  label: "Opérateur",
  notSelectedError:
    "Veuillez sélectionner un opérateur dans la liste déroulante",
  emptyMessage: "Continuez à saisir le nom de l'opérateur",
};
