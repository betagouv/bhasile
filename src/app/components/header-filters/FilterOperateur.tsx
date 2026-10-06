"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect, useMemo, useState } from "react";

import {
  OperateurSuggestion,
  useOperateurSuggestion,
} from "@/app/hooks/useOperateurSuggestion";

export const FilterOperateur = ({ selection, onToggle }: Props) => {
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

  const filteredOperateurs = useMemo(() => {
    return allOperateurs.filter((operateur) =>
      operateur.label.toLowerCase().includes(searchQuery.toLowerCase())
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
                checked: selection.includes(String(operateur.id)),
                onChange: () => onToggle(String(operateur.id)),
              },
            },
          ]}
          className="[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"
          small
        />
      ))}

      {filteredOperateurs.length === 0 && allOperateurs.length > 0 && (
        <p className="text-sm text-gray-500 italic mt-2">
          Aucun opérateur ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
};

type Props = {
  selection: string[];
  onToggle: (operateurId: string) => void;
};

const getRelationLabel = (operateur: OperateurSuggestion): string | null => {
  if (operateur.isFiliale) {
    return "Filiale";
  }
  return operateur.hasFiliales ? "Groupe" : null;
};
