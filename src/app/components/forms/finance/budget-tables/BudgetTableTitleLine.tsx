import { getYearRange } from "@/app/utils/date.util";

export const BudgetTableTitleLine = ({ label }: Props) => {
  const { years } = getYearRange();
  return (
    <tr>
      <td
        className="text-left! text-xs! font-bold uppercase"
        colSpan={years.length + 1}
      >
        {label}
      </td>
    </tr>
  );
};

type Props {
  label: string;
}
