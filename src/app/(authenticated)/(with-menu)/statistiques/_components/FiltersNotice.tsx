import { ReactElement } from "react";

export const FiltersNotice = ({
  departements,
  operateurs,
  types,
}: Props): ReactElement => {
  return (
    <span>
      <strong>* Zones : </strong>
      {departements} — <strong>Operateurs : </strong>
      {operateurs} — <strong>Types de structures : </strong>
      {types}
    </span>
  );
};

type Props = {
  departements: string | null | undefined;
  operateurs: string | null | undefined;
  types: string | null | undefined;
};
