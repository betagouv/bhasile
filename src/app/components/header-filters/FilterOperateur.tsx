import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  OperateurSuggestion,
  useOperateurSuggestion,
} from "@/app/hooks/useOperateurSuggestion";
import { deletePaginationParams } from "@/app/utils/searchParams.util";

export const FilterOperateur = () => {
  const searchParams = useSearchParams();
  const [allOperateurs, setAllOperateurs] = useState<OperateurSuggestion[]>([]);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { getAllOperateurs } = useOperateurSuggestion();

  useEffect(() => {
    const fetchOperateurs = async () => {
      const operateurs = await getAllOperateurs();
      setAllOperateurs(operateurs);
    };
    fetchOperateurs();
  }, [getAllOperateurs]);

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
    filteredOperateurs.every((operateur) =>
      selectedIds.includes(String(operateur.id))
    );

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
    const filteredIds = filteredOperateurs.map((operateur) =>
      String(operateur.id)
    );

    if (event.target.checked) {
      setSelectedIds([...new Set([...selectedIds, ...filteredIds])]);
    } else {
      setSelectedIds(selectedIds.filter((id) => !filteredIds.includes(id)));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
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

    deletePaginationParams(params);
    router.replace(`?${params.toString()}`);
  }, [selectedIds, router, searchParams]);

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
                value: String(operateur.id),
                checked: selectedIds.includes(String(operateur.id)),
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
