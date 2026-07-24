import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useState } from "react";

const options = [
  { label: "2026", value: "2026" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
];

export const YearSelector = (): ReactElement => {
  const [annee, setAnnee] = useState("2026");

  return (
    <Select
      label="Année"
      nativeSelectProps={{
        name: "annee",
        id: "annee",
        value: annee,
        onChange: (event) => setAnnee(event.target.value),
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
