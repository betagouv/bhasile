import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { DepartementAutocomplete } from "@/app/components/forms/DepartementAutocomplete";
import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { DEPARTEMENTS, REGIONS_WITHOUT_CORSE } from "@/constants";
import { CpomGranularity } from "@/types/cpom.type";

export const LocationSelector = () => {
  const { watch, control } = useFormContext();

  const granularity = watch("granularity");

  const region = watch("region");

  const departementsOfRegion = useMemo(
    () => DEPARTEMENTS.filter((departement) => departement.region === region),

    [region]
  );

  return (
    <div className="grid grid-cols-3 gap-6">
      <OperateurAutocomplete />
      <SelectWithValidation
        name="region"
        control={control}
        label="Région"
        required
      >
        <option value="">Sélectionnez une région</option>
        {REGIONS_WITHOUT_CORSE.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </SelectWithValidation>
      {granularity === CpomGranularity.DEPARTEMENTALE && (
        <SelectWithValidation
          name="departement"
          control={control}
          label="Département"
          disabled={!departementsOfRegion.length}
          required
        >
          <option value="">Sélectionnez un département</option>
          {departementsOfRegion.map((departement) => (
            <option key={departement.numero} value={departement.numero}>
              {departement.name}
            </option>
          ))}
        </SelectWithValidation>
      )}
    </div>
  );
};
