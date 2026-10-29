"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useMemo, useState } from "react";

import { toggleArrayValue } from "@/app/utils/common.util";
import { filterRegionsWithDepartements } from "@/utils/region.util";

import { FiltersRegion } from "./FiltersRegion";

export const FiltersDepartement = ({ departements, onChange }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);

  const filteredRegionsWithDepartements = useMemo(() => {
    return filterRegionsWithDepartements(searchQuery);
  }, [searchQuery]);

  const hasNoResult = filteredRegionsWithDepartements.every(
    (regionWithDepartements) => regionWithDepartements.departements.length === 0
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setExpandedRegions(
      filterRegionsWithDepartements(query)
        .filter(({ hasMatchingDepartement }) => hasMatchingDepartement)
        .map(({ region }) => region.name)
    );
  };

  return (
    <div className="py-4 flex flex-col gap-2">
      <div className="px-4">
        <Input
          label="Rechercher une région, un département"
          hideLabel
          className="mb-0"
          nativeInputProps={{
            placeholder: "Rechercher",
            value: searchQuery,
            onChange: (event) => handleSearchChange(event.target.value),
            type: "search",
          }}
        />
      </div>

      <div className={fr.cx("fr-accordions-group")} data-fr-group="false">
        {filteredRegionsWithDepartements.map(
          ({ region, departements: listDepartements }) => (
            <FiltersRegion
              region={region.name}
              key={region.name}
              hidden={listDepartements.length === 0}
              departements={departements}
              onChange={onChange}
              expanded={expandedRegions.includes(region.name)}
              onExpandedChange={(isExpanded) =>
                setExpandedRegions((regions) =>
                  isExpanded
                    ? [...regions, region.name]
                    : regions.filter((regionName) => regionName !== region.name)
                )
              }
            >
              <>
                {listDepartements.map((departement) => (
                  <Checkbox
                    key={departement.numero}
                    options={[
                      {
                        label: `${departement.name} (${departement.numero})`,
                        nativeInputProps: {
                          name: "structure-departement",
                          value: departement.numero,
                          checked: departements.includes(departement.numero),
                          onChange: () =>
                            onChange(
                              toggleArrayValue(departements, departement.numero)
                            ),
                        },
                      },
                    ]}
                    className={
                      "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 mb-1"
                    }
                    small
                  />
                ))}
              </>
            </FiltersRegion>
          )
        )}
      </div>

      {hasNoResult && (
        <p className="text-sm text-disabled-grey italic mt-2 text-center">
          Aucun département ou région ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
};

type Props = {
  departements: string[];
  onChange: (departements: string[]) => void;
};
