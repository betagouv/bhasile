import Image from "next/image";

import { cn } from "@/app/utils/classname.util";
import { HistoryEventKind } from "@/types/structure-history.type";

export const StructureEventIcon = ({ kind, large = false }: Props) => {
  const sizeClass = large ? "fr-icon--md" : "fr-icon--sm";

  switch (kind) {
    case "EXTENSION":
      return <i className={cn("ri-expand-diagonal-line", sizeClass)} />;
    case "CONTRACTION":
      return <i className={cn("ri-collapse-diagonal-line", sizeClass)} />;
    case "CREATION":
      return <i className={cn("fr-icon-add-line", sizeClass)} />;
    case "CPOM_ENTRY":
      return <i className={cn("ri-links-line", sizeClass)} />;
    case "CPOM_EXIT":
      return <i className={cn("ri-link-unlink-m", sizeClass)} />;
    case "FERMETURE":
      return (
        <Image
          src="/transformation-fermeture.svg"
          alt=""
          aria-hidden="true"
          width={large ? 24 : 18}
          height={large ? 24 : 18}
        />
      );
    default:
      return null;
  }
};

type Props = {
  kind?: HistoryEventKind;
  large?: boolean;
};
