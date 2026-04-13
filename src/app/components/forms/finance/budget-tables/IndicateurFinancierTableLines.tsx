import { ReactNode } from "react";

import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { StructureType } from "@/types/structure.type";

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
  type?: StructureType;
  lines: {
    name: string;
    label: string | ReactNode;
    subLabel?: string;
    isCurrency?: boolean;
  }[];
  indicateursFinanciers?: IndicateurFinancierApiType[];
  cpomStructures?: CpomStructureApiType[];
  years: number[];
  enabledYears?: number[];
  canEdit?: boolean;
};
