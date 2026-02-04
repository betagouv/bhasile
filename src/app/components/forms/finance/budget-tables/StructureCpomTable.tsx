import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const StructureCpomTable = ({ canEdit = true }: Props) => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  const yearsInCpom = years.filter((year) =>
    isStructureInCpom(structure, year)
  );

  const cpomStructures = canEdit
    ? (watch("cpomStructures") as CpomStructureApiType[])
    : structure?.cpomStructures;

  if (!cpomStructures) {
    return null;
  }

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
    >
      <BudgetTableLines
        lines={getCpomLines(isAutorisee)}
        cpomStructures={cpomStructures}
        canEdit={canEdit}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
        canEdit={canEdit}
      />
    </Table>
  );
};

type Props = {
  canEdit?: boolean;
};
