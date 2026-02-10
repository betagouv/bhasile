import { ReactElement } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { DocumentFinancierGranularity } from "@/types/acte-administratif.type";

type GranularityMap = Record<
  (typeof DocumentFinancierGranularity)[number],
  string
>;

export const DocumentGranularityBadge = ({
  granularity,
}: Props): ReactElement => {
  const getBadgeType = (
    granularity: (typeof DocumentFinancierGranularity)[number]
  ): BadgeType => {
    const granularities: GranularityMap = {
      CPOM: "info",
      STRUCTURE: "purple",
      STRUCTURE_ET_CPOM: "yellow",
    };
    return (granularities[granularity] as BadgeType) || "";
  };

  const getBadgeLabel = (
    granularity: (typeof DocumentFinancierGranularity)[number]
  ): string => {
    const granularities: GranularityMap = {
      CPOM: "CPOM",
      STRUCTURE: "STRUCTURE",
      STRUCTURE_ET_CPOM: "STRUCTURE & CPOM",
    };
    return granularities[granularity] || "";
  };

  if (!granularity || getBadgeLabel(granularity) === "") {
    return <></>;
  }
  return (
    <Badge type={getBadgeType(granularity)}>{getBadgeLabel(granularity)}</Badge>
  );
};

type Props = {
  granularity: (typeof DocumentFinancierGranularity)[number];
};
