import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { getRappelCriticiteLabel } from "@/app/utils/rappel.util";
import { RappelCriticite } from "@/types/dashboard.type";

type Props = {
  count: number;
  criticite: RappelCriticite;
};

export const RappelsCountBadge = ({
  count,
  criticite,
}: Props): ReactElement | null => {
  if (count === 0) {
    return null;
  }

  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-contrast-grey text-xs">
        {count}
      </span>
      <Badge type={criticite === "URGENT" ? "warning" : "yellow"}>
        {getRappelCriticiteLabel(criticite)}
      </Badge>
    </span>
  );
};
