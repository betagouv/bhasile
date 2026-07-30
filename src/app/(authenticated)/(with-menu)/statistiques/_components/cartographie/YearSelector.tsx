"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR, START_YEAR } from "@/constants";

const options = getYearRange({
  startYear: START_YEAR,
  endYear: CURRENT_YEAR - 1,
}).years.map((year) => ({ label: year.toString(), value: year.toString() }));

export const YearSelector = (): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = searchParams.get("annee") ?? String(CURRENT_YEAR - 1);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("annee", selectedYear);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      label="Année"
      className="mb-0"
      nativeSelectProps={{
        name: "annee",
        id: "annee",
        value: currentYear,
        onChange: handleYearChange,
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
