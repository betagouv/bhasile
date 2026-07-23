import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useState } from "react";

const options = [
  { label: "Régions", value: "reg" },
  { label: "Départements", value: "dep" },
];

export const DecoupageSelector = (): ReactElement => {
  const [decoupage, setDecoupage] = useState("2026");

  return (
    <Select
      label="Découpage"
      nativeSelectProps={{
        name: "decoupage",
        id: "decoupage",
        value: decoupage,
        onChange: (event) => setDecoupage(event.target.value),
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
