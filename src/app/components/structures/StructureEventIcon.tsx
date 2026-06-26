import Image from "next/image";

import { cn } from "@/app/utils/classname.util";
import { HistoryEventKind } from "@/types/structure-history.type";

const iconClassByKind: Record<Exclude<HistoryEventKind, "FERMETURE">, string> = {
  CREATION: "fr-icon-add-line",
  EXTENSION: "ri-expand-diagonal-line",
  CONTRACTION: "ri-collapse-diagonal-line",
  CPOM_ENTRY: "ri-links-line",
  CPOM_EXIT: "ri-link-unlink-m",
};

export const StructureEventIcon = ({ kind, large = false }: Props) => {
  const sizeClass = large ? "fr-icon--md" : "fr-icon--sm";

  if (!kind) {
    return null;
  }

  if (kind === "FERMETURE") {
    return (
      <Image
        src="/transformation-fermeture.svg"
        alt=""
        aria-hidden="true"
        width={large ? 24 : 18}
        height={large ? 24 : 18}
        loading="lazy"
      />
    );
  }

  return <i className={cn(iconClassByKind[kind], sizeClass)} />;
};

type Props = {
  kind?: HistoryEventKind;
  large?: boolean;
};
