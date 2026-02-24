import { fr } from "@codegouvfr/react-dsfr";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DEPARTEMENTS, REGIONS_WITHOUT_CORSE } from "@/constants";

import { FiltersRegion } from "./FiltersRegion";

export const FiltersDepartement = () => {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [departements, setDepartements] = useState<string[]>(
    searchParams.get("departements")?.split(",") || []
  );

  const handleDepartementToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (departements.includes(value)) {
      setDepartements(
        departements.filter((departement) => departement !== value)
      );
    } else {
      setDepartements([...departements, value]);
    }
  };

  const prevDepartements = useRef(departements);
  useEffect(() => {
    if (prevDepartements.current !== departements) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("departements", departements.join(","));
      router.replace(`?${params.toString()}`);
      prevDepartements.current = departements;
    }
  }, [departements, searchParams, router]);

  return (
    <div className="max-h-[40.5rem] overflow-y-scroll overflow-x-hidden py-4">
      <div className={fr.cx("fr-accordions-group")}>
        {REGIONS_WITHOUT_CORSE.map((region) => (
          <FiltersRegion
            region={region}
            key={region}
            departements={departements}
            setDepartements={setDepartements}
          >
            <>
              {DEPARTEMENTS.filter(
                (departement) => departement.region === region
              )
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
                          onChange: handleDepartementToggle,
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
