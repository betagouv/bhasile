import { ReactNode } from "react";

import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

import { IndicateurFinancierTableLine } from "./IndicateurFinancierTableLine";

export const IndicateurFinancierTableLines = ({
  lines,
  indicateursFinanciers,
  years,
  canEdit = true,
}: Props) => {
  return (
    <>
      {lines.map((line) => (
        <IndicateurFinancierTableLine
          key={line.name}
          name={line.name}
          label={line.label}
          subLabel={line.subLabel}
          years={years}
          indicateursFinanciers={indicateursFinanciers}
          canEdit={canEdit}
          isCurrency={line.isCurrency}
        />
      ))}
    </>
  );
};

type Props = {
  lines: {
    name: string;
    label: string | ReactNode;
    subLabel?: string;
    isCurrency?: boolean;
  }[];
  indicateursFinanciers?: IndicateurFinancierApiType[];
  years: number[];
  canEdit?: boolean;
};
