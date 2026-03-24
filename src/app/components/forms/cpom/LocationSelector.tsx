import Select from "@codegouvfr/react-dsfr/Select";
import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { getErrorMessages } from "@/app/utils/getErrorMessages.util";
import { DEPARTEMENTS, REGIONS } from "@/constants";
import { CpomDepartementApiType } from "@/schemas/api/cpom.schema";

import { DepartementsSelector } from "../DepartementsSelector";

export const LocationSelector = () => {
  const { watch, control, setValue, formState } = useFormContext();

  const errorMessages = getErrorMessages(formState, "departements");

  const granularity = watch("granularity");

  const region = watch("region.name");
  const departements = watch("departements") as CpomDepartementApiType[];

  const departementsOfRegion = useMemo(
    () => DEPARTEMENTS.filter((departement) => departement.region === region),

    [region]
  );

  const handleDepartementChange = (value: string) => {
    if (value) {
      setValue("departements.0.departement.numero", value, {
        shouldValidate: true,
      });
    } else {
      setValue("departements.0.departement.numero", undefined, {
        shouldValidate: true,
      });
    }
  };

  const departementLength = useMemo(() => departements.length, [departements]);
  const firstDepartement = useMemo(() => departements[0], [departements]);
  const prevRegion = useRef(region);
  const prevGranularity = useRef(granularity);
  useEffect(() => {
    if (
      prevGranularity.current === granularity &&
      prevRegion.current === region
    ) {
      return;
    }
    prevGranularity.current = granularity;
    prevRegion.current = region;
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
    }
    if (granularity === "INTERDEPARTEMENTALE") {
      setValue("departements", [], { shouldValidate: true });
    }
    if (granularity === "REGIONALE") {
      setValue(
        "departements",
        departementsOfRegion.map((departement) => ({
          departement: { numero: departement.numero },
        })),
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

  useEffect(() => {
    if (departementsOfRegion.length === 1) {
      setValue("granularity", "REGIONALE");
    }
  }, [departementsOfRegion, setValue]);

  const handleDepartementToggle = (value: string) => {
    if (
      departements.find(
        (departement) => departement.departement?.numero === value
      )
    ) {
      if (departements.length === 1) {
        setValue(
          "departements",
          departementsOfRegion.map((departement) => ({
            departement: { numero: departement.numero },
          })),
          {
            shouldValidate: true,
          }
        );
      } else {
        setValue(
          "departements",
          departements.filter(
            (departement) => departement.departement?.numero !== value
          ),
          { shouldValidate: true }
        );
      }
    } else {
      setValue(
        "departements",
        [...departements, { departement: { numero: value } }],
        {
          shouldValidate: true,
        }
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        <OperateurAutocomplete />
        <SelectWithValidation
          name="region.name"
          id="region"
          control={control}
          label="Région"
          required
        >
          <option value="">Sélectionnez une région</option>
          {REGIONS.filter((region) => region.show).map((region) => (
            <option key={region.name} value={region.name}>
              {region.name}
            </option>
          ))}
        </SelectWithValidation>
        {granularity === "DEPARTEMENTALE" && (
          <Select
            label="Département"
            nativeSelectProps={{
              name: "departements.0.departement.numero",
              id: "departements",
              value:
                departements && departements.length === 1
                  ? departements[0].departement?.numero
                  : "",
              onChange: (e) => handleDepartementChange(e.target.value),
            }}
            disabled={!departementsOfRegion.length}
          >
            <option value="">Sélectionnez un département</option>
            {departementsOfRegion.map((departement) => (
              <option key={departement.numero} value={departement.numero}>
                {departement.numero} - {departement.name}
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
      {errorMessages?.length > 0 && (
        <p className="text-default-error m-0 p-0 text-right">
          {errorMessages[0]}
        </p>
      )}
    </>
  );
};
