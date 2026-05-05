"use client";

import { ReactElement } from "react";
import { useController } from "react-hook-form";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";
import { useOperateurSuggestion } from "@/app/hooks/useOperateurSuggestion";

import { AutocompleteField } from "./AutocompleteField";
import { AutocompleteFieldRhf } from "./AutocompleteFieldRhf";

export type OperateurAutocompleteProps = {
  operateurName?: string | undefined;
  setOperateurName?: (name: string | undefined) => void;
  operateurId?: number | undefined;
  setOperateurId?: (id: number | undefined) => void;
};

const FETCH_LABELS = {
  id: "operateur",
  label: "Opérateur",
  notSelectedError:
    "Veuillez sélectionner un opérateur dans la liste déroulante",
  emptyMessage: "Continuez à saisir le nom de l'opérateur",
};

export const OperateurAutocomplete = (
  props: OperateurAutocompleteProps = {}
): ReactElement => {
  const fetchSuggestions = useOperateurSuggestion();

  if (props.setOperateurName) {
    return (
      <AutocompleteField<AutocompleteSuggestion>
        {...FETCH_LABELS}
        name="operateur.name"
        value={props.operateurName ?? ""}
        onValueChange={(next) => props.setOperateurName?.(next || undefined)}
        onSelect={(suggestion) => {
          props.setOperateurName?.(suggestion.label);
          const id = Number(suggestion.id);
          if (!Number.isNaN(id)) {
            props.setOperateurId?.(id);
          }
        }}
        onClear={() => props.setOperateurId?.(undefined)}
        fetchSuggestions={fetchSuggestions}
      />
    );
  }

  return (
    <>
      <AutocompleteFieldRhf<AutocompleteSuggestion>
        {...FETCH_LABELS}
        name="operateur.name"
        rules={{ required: true }}
        fetchSuggestions={fetchSuggestions}
        onAfterSelect={(suggestion, { setValue }) => {
          setValue("operateur.id", suggestion.id);
        }}
      />
      <OperateurIdHiddenInput />
    </>
  );
};

const OperateurIdHiddenInput = (): ReactElement => {
  const { field } = useController({
    name: "operateur.id",
    rules: { required: true },
  });
  return <input aria-hidden="true" type="hidden" {...field} />;
};
