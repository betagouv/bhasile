import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useState } from "react";

import { normalizeAccents } from "@/app/utils/string.util";
import { PerimeterRead } from "@/types/agent.type";

export const PerimeterPicker = ({
  perimeters,
  perimeterId,
  onChange,
  errorMessage,
}: Props): ReactElement => {
  const [search, setSearch] = useState("");
  const matches = filterPerimeters(perimeters, search);

  const changeSearch = (nextSearch: string): void => {
    setSearch(nextSearch);
    const nextMatches = filterPerimeters(perimeters, nextSearch);
    if (!nextMatches.some(({ id }) => id === perimeterId)) {
      onChange(nextMatches[0]?.id);
    }
  };

  return (
    <>
      <Input
        label="Rechercher un périmètre"
        hintText="Par nom ou numéro de département"
        nativeInputProps={{
          type: "search",
          value: search,
          onChange: (event) => changeSearch(event.target.value),
        }}
      />
      <Select
        label="Périmètre"
        nativeSelectProps={{
          value: perimeterId ?? "",
          onChange: (event) =>
            onChange(
              event.target.value ? Number(event.target.value) : undefined
            ),
        }}
        state={errorMessage ? "error" : "default"}
        stateRelatedMessage={errorMessage}
      >
        <option value="">
          {matches.length === 0
            ? "Aucun périmètre ne correspond"
            : "Choisir un périmètre"}
        </option>
        {matches.map((perimeter) => (
          <option key={perimeter.id} value={perimeter.id}>
            {perimeter.name}
          </option>
        ))}
      </Select>
    </>
  );
};

const filterPerimeters = (
  perimeters: PerimeterRead[],
  search: string
): PerimeterRead[] =>
  perimeters.filter(({ name, zoneLabel }) =>
    normalizeAccents(`${name} ${zoneLabel}`).includes(
      normalizeAccents(search.trim())
    )
  );

type Props = {
  perimeters: PerimeterRead[];
  perimeterId: number | undefined;
  onChange: (perimeterId: number | undefined) => void;
  errorMessage?: string;
};
