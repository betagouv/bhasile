import { ReactNode } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { getPercentage } from "@/app/utils/common.util";

export const ActivitePlacesLabel = ({ value, total, children }: Props) => (
  <span>
    <strong>
      <NumberDisplay value={value} />
    </strong>{" "}
    {children}{" "}
    <span className="text-mention-grey">({getPercentage(value, total)})</span>
  </span>
);

type Props = {
  value: number;
  total: number;
  children: ReactNode;
};
