import Select from "@codegouvfr/react-dsfr/Select";
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
  const departements = watch("departements");

  const departementsOfRegion = useMemo(
    () =>
      DEPARTEMENTS.filter((departement) =>
        region ? departement.region === region : true
      ),

    [region]
  );

  const handleDepartementChange = (value: string) => {
    if (value) {
      setValue("departements", [value], { shouldValidate: true });
    } else {
      setValue("departements", [], { shouldValidate: true });
    }
  };

  useEffect(() => {
    setValue(
      "departements",
      departementsOfRegion.map((departement) => departement.numero),
      { shouldValidate: true }
    );
  }, [region, setValue, departementsOfRegion, granularity]);

  console.log(departements);
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
        <Select
          label="Département"
          nativeSelectProps={{
            name: "departements",
            value:
              departements && departements.length === 1 ? departements[0] : "",
            onChange: (e) => handleDepartementChange(e.target.value),
          }}
          disabled={!departementsOfRegion.length}
        >
          <option value="">Sélectionnez un département</option>
          {departementsOfRegion.map((departement) => (
            <option key={departement.numero} value={departement.numero}>
              {departement.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
};
