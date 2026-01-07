import { getYearRange } from "@/app/utils/date.util";

export const BudgetTableTitleLine = ({ label }: Props) => {
  const { years } = getYearRange();
  return (
    <tr>
      <td colSpan={years.length + 1}>{label}</td>
    </tr>
  );
};

interface Props {
  label: string;
}
