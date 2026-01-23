import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { DEPARTEMENTS, REGIONS_WITHOUT_CORSE } from "@/constants";
import { CpomGranularity } from "@/types/cpom.type";

export const LocationSelector = () => {
  const { watch, control, setValue } = useFormContext();

  const granularity = watch("granularity");

  const region = watch("region");

  const departementsOfRegion = useMemo(
    () => DEPARTEMENTS.filter((departement) => departement.region === region),

    [region]
  );

  const handleDepartementChange = (value: string) => {
    if (value) {
      setValue("departement", [Number(value)], { shouldValidate: true });
    } else {
      setValue("departement", [], { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (departementsOfRegion && granularity === CpomGranularity.REGIONALE) {
      setValue(
        "departement",
        departementsOfRegion.map((departement) => departement.numero),
        { shouldValidate: true }
      );
    }
  }, [region, setValue, departementsOfRegion, granularity]);

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
          onChange={handleDepartementChange}
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
