import { ReactElement } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { Repartition, RepartitionLabel } from "@/types/adresse.type";

export const TypeBatiBadge = ({
  typeBati,
  className,
}: Props): ReactElement | null => {
  if (!typeBati) {
    return null;
  }
  const getBadgeType = (typeBati: Repartition): BadgeType => {
    const typesByRepartition: Record<Repartition, BadgeType> = {
      [Repartition.DIFFUS]: "new",
      [Repartition.COLLECTIF]: "info",
      [Repartition.MIXTE]: "purple",
    };
    return typesByRepartition[typeBati];
  };
  return (
    <Badge type={getBadgeType(typeBati)} className={className}>
      {RepartitionLabel[typeBati]}
    </Badge>
  );
};

type Props = {
  typeBati?: Repartition;
  className?: string;
};
