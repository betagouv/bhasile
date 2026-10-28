"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect, useMemo, useState } from "react";

import {
  OperateurSuggestion,
  useOperateurSuggestion,
} from "@/app/hooks/useOperateurSuggestion";
import { toggleArrayValue } from "@/app/utils/common.util";
import { matchesSearchQuery } from "@/app/utils/string.util";
import { FilterSelection } from "@/hooks/useFilterSelection";

export const FilterOperateur = ({ filterSelection }: Props) => {
  const [allOperateurs, setAllOperateurs] = useState<OperateurSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { getAllOperateurs } = useOperateurSuggestion();

  useEffect(() => {
    const fetchOperateurs = async () => {
      const operateurs = await getAllOperateurs();
      setAllOperateurs(operateurs);
    };
    fetchOperateurs();
  }, [getAllOperateurs]);

  const allOperateurIds = allOperateurs.map(({ id }) => String(id));
  const checkedOperateurIds = filterSelection.getCheckedValues(allOperateurIds);

  const filteredOperateurs = useMemo(() => {
    return allOperateurs.filter((operateur) =>
      matchesSearchQuery(operateur.label, searchQuery)
    );
  }, [allOperateurs, searchQuery]);

  return (
    <div className="p-4 flex flex-col gap-2">
      <Input
        label="Rechercher un opérateur"
        hideLabel
        className="mb-0"
        nativeInputProps={{
          placeholder: "Rechercher",
          value: searchQuery,
          onChange: (event) => setSearchQuery(event.target.value),
          type: "search",
        }}
      />

      {filteredOperateurs.map((operateur) => (
        <Checkbox
          key={operateur.id}
          options={[
            {
              label: (
                <>
                  {operateur.label}
                  {getRelationLabel(operateur) && (
                    <span className="text-mention-grey italic">
                      &nbsp;–&nbsp;{getRelationLabel(operateur)}
                    </span>
                  )}
                </>
              ),
              nativeInputProps: {
                name: `operateur-${operateur.id}`,
                value: String(operateur.id),
                checked: checkedOperateurIds.includes(String(operateur.id)),
                onChange: () =>
                  filterSelection.setCheckedValues(
                    toggleArrayValue(checkedOperateurIds, String(operateur.id)),
                    allOperateurIds
                  ),
              },
            },
          ]}
          className="[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"
          small
        />
      ))}

      {filteredOperateurs.length === 0 && allOperateurs.length > 0 && (
        <p className="text-sm text-disabled-grey italic mt-2 text-center">
          Aucun opérateur ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
};

const getRelationLabel = (operateur: OperateurSuggestion): string | null => {
  if (operateur.isFiliale) {
    return "Filiale";
  }
  return operateur.hasFiliales ? "Groupe" : null;
};

type Props = {
  filterSelection: FilterSelection;
};
