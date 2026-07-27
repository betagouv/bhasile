import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement } from "react";

const options = [
  { label: "Régions", value: "reg" },
  { label: "Départements", value: "dep" },
];

export const DecoupageSelector = ({
  decoupage,
  setDecoupage,
}: Props): ReactElement => {
  return (
    <Select
      label="Découpage"
      className="mb-0"
      nativeSelectProps={{
        name: "decoupage",
        id: "decoupage",
        value: decoupage,
        onChange: (event) => setDecoupage(event.target.value as "dep" | "reg"),
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

type Props = {
  decoupage: "dep" | "reg";
  setDecoupage: (decoupage: "dep" | "reg") => void;
};
