"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { DEFAULT_CARTOGRAPHIE_GRANULARITE } from "@/schemas/api/statistique-cartographie.schema";

const options = [
  { label: "Régions", value: "reg" },
  { label: "Départements", value: "dep" },
];

export const DecoupageSelector = (): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentGranularite =
    searchParams.get("granularite") || DEFAULT_CARTOGRAPHIE_GRANULARITE;
  const currentValue = currentGranularite === "departement" ? "dep" : "reg";

  const handleDecoupageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    params.set(
      "granularite",
      selectedValue === "dep" ? "departement" : "region"
    );
    params.delete("region");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      label="Découpage"
      className="mb-0"
      nativeSelectProps={{
        name: "decoupage",
        id: "decoupage",
        value: currentValue,
        onChange: handleDecoupageChange,
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
};
