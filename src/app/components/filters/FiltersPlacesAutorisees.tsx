import { Range } from "@codegouvfr/react-dsfr/Range";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";
import { useStructureStats } from "@/app/hooks/useStructureStats";

const DEBOUNCE_TIME = 300;

export const FiltersPlacesAutorisees = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { maxPlacesAutorisees, minPlacesAutorisees } = useStructureStats();

  const [placesAutorisees, setPlacesAutorisees] = useState(
    searchParams.get("places")?.split(",").map(Number) || []
  );

  const noPlacesAutoriseesSelected = placesAutorisees.length === 0;

  const handlePlacesAutoriseesChange = (index: number, value: number) => {
    if (noPlacesAutoriseesSelected || placesAutorisees.length === 1) {
      const basePlacesAutorisees = [minPlacesAutorisees, maxPlacesAutorisees];
      basePlacesAutorisees[index] = value;
      setPlacesAutorisees(basePlacesAutorisees);
      return;
    }
    const newPlacesAutorisees = [...placesAutorisees];
    newPlacesAutorisees[index] = value;
    if (
      newPlacesAutorisees[0] === minPlacesAutorisees &&
      newPlacesAutorisees[1] === maxPlacesAutorisees
    ) {
      setPlacesAutorisees([]);
      return;
    }
    setPlacesAutorisees(newPlacesAutorisees);
  };

  const handlePlacesAutoriseesUpdate = useDebounceCallback((): void => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("places", placesAutorisees.join(","));
    router.replace(`?${params.toString()}`);
  }, DEBOUNCE_TIME);

  useEffect(() => {
    handlePlacesAutoriseesUpdate();
  }, [placesAutorisees, handlePlacesAutoriseesUpdate]);

  return (
    <div className="px-6 pt-5 pb-6">
      <fieldset>
        <legend className="text-title-blue-france text-sm font-medium mb-4">
          Places autorisées
        </legend>
        <Range
          double
          label=""
          max={maxPlacesAutorisees}
          min={minPlacesAutorisees}
          nativeInputProps={[
            {
              value: placesAutorisees[0] ?? minPlacesAutorisees,
              onChange: (e) =>
                handlePlacesAutoriseesChange(0, Number(e.target.value)),
            },
            {
              value: placesAutorisees[1] ?? maxPlacesAutorisees,
              onChange: (e) =>
                handlePlacesAutoriseesChange(1, Number(e.target.value)),
            },
          ]}
        />
      </fieldset>
    </div>
  );
};
