import { ReactNode } from "react";

export const BudgetTableLineLabel = ({ label, subLabel }: Props) => {
  return (
    <td className="text-left! w-[220px]">
      <strong className="whitespace-nowrap">{label}</strong>
      <br />
      <span className="text-xs">{subLabel}</span>
    </td>
  );
};

type Props = {
  label: string | ReactNode;
  subLabel?: string | ReactNode;
};
