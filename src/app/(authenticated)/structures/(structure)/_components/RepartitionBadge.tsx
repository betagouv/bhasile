import { ReactElement } from "react";

import { Repartition } from "@/types/adresse.type";

import { Badge, BadgeType } from "../../../../components/common/Badge";

export const RepartitionBadge = ({
  repartition,
  className,
}: Props): ReactElement => {
  const getBadgeType = (repartition: Repartition): BadgeType => {
    const typesByRepartition: Record<Repartition, BadgeType> = {
      [Repartition.DIFFUS]: "new",
      [Repartition.COLLECTIF]: "info",
      [Repartition.MIXTE]: "purple",
    };
    return typesByRepartition[repartition];
  };
  return (
    <Badge type={getBadgeType(repartition)} className={className}>
      {repartition}
    </Badge>
  );
};

type Props = {
  repartition: Repartition;
  className?: string;
};
