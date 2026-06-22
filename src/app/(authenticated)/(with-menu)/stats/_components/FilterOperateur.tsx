import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  OperateurSuggestion,
  useOperateurSuggestion,
} from "@/app/hooks/useOperateurSuggestion";

export const FilterOperateur = () => {
  const searchParams = useSearchParams();
  const [allOperateurs, setAllOperateurs] = useState<OperateurSuggestion[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchSuggestions = useOperateurSuggestion();

  useEffect(() => {
    const fetchOperateurs = async () => {
      // TODO : mettre une vraie recherche
      const operateurs = await fetchSuggestions("opér");
      setAllOperateurs(operateurs);
    };
    fetchOperateurs();
  }, [fetchSuggestions]);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return searchParams.get("operateurs")?.split(",").filter(Boolean) || [];
  });

  const filteredOperateurs = useMemo(() => {
    return allOperateurs.filter((operateur) =>
      operateur.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allOperateurs, searchQuery]);

  const isAllChecked =
    filteredOperateurs.length > 0 &&
    filteredOperateurs.every((op) => selectedIds.includes(op.id));

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const operateurId = event.target.value;
    if (selectedIds.includes(operateurId)) {
      setSelectedIds(selectedIds.filter((id) => id !== operateurId));
    } else {
      setSelectedIds([...selectedIds, operateurId]);
    }
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      const filteredIds = filteredOperateurs.map((operateur) => operateur.id);
      setSelectedIds([...new Set([...selectedIds, ...filteredIds])]);
    } else {
      const filteredIds: string[] = filteredOperateurs.map(
        (operateur) => operateur.id
      );
      setSelectedIds(selectedIds.filter((id) => !filteredIds.includes(id)));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newValue = selectedIds.join(",");

    if (
      params.get("operateurs") === newValue ||
      (!params.get("operateurs") && !newValue)
    ) {
      return;
    }

    if (selectedIds.length > 0) {
      params.set("operateurs", newValue);
    } else {
      params.delete("operateurs");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      "",
      newUrl
    );
  }, [selectedIds]);

  return (
    <div className="p-4 flex flex-col gap-2">
      <Input
        label="Rechercher un opérateur"
        hideLabel
        nativeInputProps={{
          placeholder: "Rechercher",
          value: searchQuery,
          onChange: (event) => setSearchQuery(event.target.value),
          type: "search",
        }}
      />

      {filteredOperateurs.length !== 0 && (
        <Checkbox
          options={[
            {
              label: "Tous les opérateurs",
              nativeInputProps: {
                name: "operateur-all",
                value: "all",
                checked: isAllChecked,
                onChange: handleSelectAllChange,
              },
            },
          ]}
          className="[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 mt-2"
          small
        />
      )}

      {filteredOperateurs.map((operateur) => (
        <Checkbox
          key={operateur.id}
          options={[
            {
              label: operateur.label,
              nativeInputProps: {
                name: `operateur-${operateur.id}`,
                value: operateur.id,
                checked: selectedIds.includes(operateur.id),
                onChange: handleTypeChange,
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
