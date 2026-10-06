import { fr } from "@codegouvfr/react-dsfr";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { toggleArrayValue } from "@/app/utils/common.util";
import { REGIONS } from "@/constants";
import { getDepartementsForRegion } from "@/utils/region.util";

import { FiltersRegion } from "./FiltersRegion";

export const FiltersDepartement = ({ departements, onChange }: Props) => {
  return (
    <div className="py-4">
      <div className={fr.cx("fr-accordions-group")}>
        {REGIONS.filter((region) => region.show).map((region) => (
          <FiltersRegion
            region={region.name}
            key={region.name}
            departements={departements}
            onChange={onChange}
          >
            <>
              {getDepartementsForRegion(region.name)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((departement) => (
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
        ))}
      </div>
    </div>
  );
};

type Props = {
  departements: string[];
  onChange: (departements: string[]) => void;
};
