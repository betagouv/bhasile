import Image from "next/image";

import { cn } from "@/app/utils/classname.util";
import { HistoryEventKind } from "@/types/structure-history.type";

const iconClassByKind: Record<
  Exclude<StructureEventIconKind, "FERMETURE">,
  string
> = {
  CREATION: "fr-icon-add-line",
  EXTENSION: "ri-expand-diagonal-line",
  CONTRACTION: "ri-collapse-diagonal-line",
  CPOM_ENTRY: "ri-links-line",
  CPOM_EXIT: "ri-link-unlink-m",
  MIXED: "fr-icon-more-line",
};

const iconClassBySize: Record<IconSize, string> = {
  sm: "[&::before]:[--icon-size:12px]!",
  md: "[&::before]:[--icon-size:16px]!",
  lg: "[&::before]:[--icon-size:24px]!",
};

const imagePixelsBySize: Record<IconSize, number> = {
  sm: 12,
  md: 16,
  lg: 24,
};

export const StructureEventIcon = ({ kind, size }: Props) => {
  if (!kind) {
    return null;
  }

  if (kind === "FERMETURE") {
    const pixels = imagePixelsBySize[size];
    return (
      <Image
        src="/transformation-fermeture.svg"
        alt=""
        aria-hidden="true"
        width={pixels}
        height={pixels}
        loading="lazy"
      />
    );
  }

  return <i className={cn(iconClassByKind[kind], iconClassBySize[size])} />;
};

type IconSize = "sm" | "md" | "lg";

type StructureEventIconKind = HistoryEventKind | "MIXED";

type Props = {
  kind?: StructureEventIconKind;
  size: IconSize;
};
