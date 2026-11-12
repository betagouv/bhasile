"use client";

import { Select } from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useState } from "react";

import { formatDate } from "@/app/utils/date.util";
import { getCurrentYear } from "@/app/utils/now.util";

export const MonthSelect = ({
  initialValue,
  hint,
  onChange,
}: Props): ReactElement => {
  const [initialYear, initialMonth] = initialValue?.split("-") ?? [];
  const [month, setMonth] = useState(initialMonth ?? "");
  const [year, setYear] = useState(initialYear ?? "");
  const years = getYearOptions(initialYear);

  const update = (nextMonth: string, nextYear: string): void => {
    setMonth(nextMonth);
    setYear(nextYear);
    onChange(nextMonth && nextYear ? `${nextYear}-${nextMonth}` : null);
  };

  return (
    <fieldset className="fr-fieldset mb-0">
      <legend className="fr-fieldset__legend fr-text--regular">
        Mois des données
        <span className="fr-hint-text">{hint}</span>
      </legend>
      <div className="flex gap-4">
        <Select
          label="Mois"
          className="mb-0"
          nativeSelectProps={{
            value: month,
            onChange: (event) => update(event.target.value, year),
          }}
        >
          <option value="">Choisir</option>
          {MONTHS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Année"
          className="mb-0"
          nativeSelectProps={{
            value: year,
            onChange: (event) => update(month, event.target.value),
          }}
        >
          <option value="">Choisir</option>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    </fieldset>
  );
};

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: formatDate(new Date(Date.UTC(2000, index, 15)), {
    month: "long",
    timeZone: "UTC",
  }),
}));

const getYearOptions = (initialYear: string | undefined): string[] => {
  const currentYear = getCurrentYear();
  const recentYears = [currentYear, currentYear - 1, currentYear - 2].map(
    String
  );
  return initialYear && !recentYears.includes(initialYear)
    ? [initialYear, ...recentYears]
    : recentYears;
};

type Props = {
  initialValue: string | null;
  hint: string;
  onChange: (value: string | null) => void;
};
