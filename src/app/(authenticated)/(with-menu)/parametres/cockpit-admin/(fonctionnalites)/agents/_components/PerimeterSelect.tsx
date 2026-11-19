import { Select } from "@codegouvfr/react-dsfr/Select";
import { ReactElement, SelectHTMLAttributes } from "react";

import { PerimeterRead } from "@/types/agent.type";

export const PerimeterSelect = ({
  perimeters,
  nativeSelectProps,
  errorMessage,
}: Props): ReactElement => (
  <Select
    label="Périmètre"
    nativeSelectProps={nativeSelectProps}
    state={errorMessage ? "error" : "default"}
    stateRelatedMessage={errorMessage}
  >
    <option value="">Choisir un périmètre</option>
    {perimeters.map(({ id, name, zoneLabel }) => (
      <option key={id} value={id}>
        {name} ({zoneLabel})
      </option>
    ))}
  </Select>
);

type Props = {
  perimeters: PerimeterRead[];
  nativeSelectProps: SelectHTMLAttributes<HTMLSelectElement>;
  errorMessage?: string;
};
