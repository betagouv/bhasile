import { Badge } from "@/app/components/common/Badge";

export const CpomYearBadge = ({ isInCpom }: Props) =>
  isInCpom ? (
    <Badge type="new" className="text-[10px]">
      En CPOM
    </Badge>
  ) : (
    <Badge type="disabled" className="text-[10px]">
      Hors CPOM
    </Badge>
  );

type Props = {
  isInCpom: boolean;
};
