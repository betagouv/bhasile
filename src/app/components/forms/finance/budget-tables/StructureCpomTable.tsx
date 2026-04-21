import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getBudgetTableLines } from "./getBudgetTableLines";

export const StructureCpomTable = ({ canEdit = true, type }: Props) => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  const yearsInCpom = years.filter((year) => structure.isInCpomPerYear[year]);

  const cpomStructures = canEdit
    ? (watch("cpomStructures") as CpomStructureApiType[])
    : structure?.cpomStructures;

  if (!cpomStructures) {
    return null;
  }

  const isAutorisee = isStructureAutorisee(type);

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
      stickFirstColumn
    >
      <BudgetTableLines
        years={years}
        lines={getBudgetTableLines(isAutorisee)}
        cpomStructures={cpomStructures}
        canEdit={canEdit}
        type={type}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomStructures={cpomStructures}
        enabledYears={yearsInCpom}
        canEdit={canEdit}
        years={years}
        type={type}
      />
    </Table>
  );
};

type Props = {
  canEdit?: boolean;
  type?: StructureType;
};
