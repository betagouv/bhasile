"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useMemo, useState } from "react";

import { toggleArrayValue } from "@/app/utils/common.util";
import { REGIONS } from "@/constants";
import { getDepartementsForRegion } from "@/utils/region.util";

import { FiltersRegion } from "./FiltersRegion";

export const FiltersDepartement = ({ departements, onChange }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRegionsWithDepartements = useMemo(() => {
    const queryNormalized = searchQuery.toLowerCase().trim();

    return REGIONS.filter((region) => region.show)
      .map((region) => {
        const matchRegion = region.name.toLowerCase().includes(queryNormalized);

        const regionDepartements = getDepartementsForRegion(region.name)
          .sort((premierDepartement, secondDepartement) =>
            premierDepartement.name.localeCompare(secondDepartement.name)
          )
          .filter((departement) => {
            if (!queryNormalized || matchRegion) {
              return true;
            }

            const matchNomDepartement = departement.name
              .toLowerCase()
              .includes(queryNormalized);
            const matchNumeroDepartement = departement.numero
              .toLowerCase()
              .includes(queryNormalized);

            return matchNomDepartement || matchNumeroDepartement;
          });

        return {
          region,
          departements: regionDepartements,
        };
      })
      .filter(
        (regionWithDepartements) =>
          regionWithDepartements.departements.length > 0
      );
  }, [searchQuery]);

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
            onChange: (event) => setSearchQuery(event.target.value),
            type: "search",
          }}
        />
      </div>

      <div className={fr.cx("fr-accordions-group")}>
        {filteredRegionsWithDepartements.map(
          ({ region, departements: listDepartements }) => (
            <FiltersRegion
              region={region.name}
              key={region.name}
              departements={departements}
              onChange={onChange}
            >
              <>
                {listDepartements.map((departement) => (
                  <Checkbox
                    key={departement.numero}
                    options={[
                      {
                        label: `${departement.name} - ${departement.numero}`,
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

      {filteredRegionsWithDepartements.length === 0 && (
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
