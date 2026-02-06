import Select from "@codegouvfr/react-dsfr/Select";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { DEPARTEMENTS, REGIONS_WITHOUT_CORSE } from "@/constants";

import { DepartementsSelector } from "../DepartementsSelector";

export const LocationSelector = () => {
  const { watch, control, setValue } = useFormContext();

  const granularity = watch("granularity");

  const region = watch("region");
  const departements = watch("departements") as string[];

  const departementsOfRegion = useMemo(
    () => DEPARTEMENTS.filter((departement) => departement.region === region),

    [region]
  );

  const handleDepartementChange = (value: string) => {
    if (value) {
      setValue("departements", [value], { shouldValidate: true });
    } else {
      setValue("departements", [], { shouldValidate: true });
    }
  };

  const departementLength = useMemo(() => departements.length, [departements]);
  const firstDepartement = useMemo(() => departements[0], [departements]);
  useEffect(() => {
    if (granularity === "DEPARTEMENTALE") {
      if (departementLength === 0) {
        return;
      }
      if (
        departementLength > 1 ||
        DEPARTEMENTS.find(
          (departement) => departement.numero === firstDepartement
        )?.region !== region
      ) {
        setValue("departements", [], { shouldValidate: true });
      }
    } else {
      setValue(
        "departements",
        departementsOfRegion.map((departement) => departement.numero),
        { shouldValidate: true }
      );
    }
  }, [
    departementLength,
    firstDepartement,
    region,
    setValue,
    departementsOfRegion,
    granularity,
  ]);

  const handleDepartementToggle = (value: string) => {
    if (departements.includes(value)) {
      if (departements.length === 1) {
        setValue(
          "departements",
          departementsOfRegion.map((departement) => departement.numero),
          {
            shouldValidate: true,
          }
        );
      } else {
        setValue(
          "departements",
          departements.filter((departement) => departement !== value),
          { shouldValidate: true }
        );
      }
    } else {
      setValue("departements", [...departements, value], {
        shouldValidate: true,
      });
    }
  };

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
      {granularity === "DEPARTEMENTALE" && (
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
      {granularity === "INTERDEPARTEMENTALE" && (
        <DepartementsSelector
          departements={departementsOfRegion}
          selectedDepartements={departements}
          handleDepartementToggle={handleDepartementToggle}
        />
      )}
    </div>
  );
};
