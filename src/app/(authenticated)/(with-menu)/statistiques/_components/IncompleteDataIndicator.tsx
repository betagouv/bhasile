import Image from "next/image";
import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { pluralize } from "@/app/utils/string.util";

export const IncompleteDataIndicator = ({
  nbStructures,
  structuresPercentage,
  align,
}: Props): ReactElement => {
  return (
    <span className="group relative inline-flex items-center border-b border-dashed print:border-0 z-30">
      <span className="relative inline-block h-3 w-3 align-middle filter-[invert(9%)_sepia(100%)_saturate(7080%)_hue-rotate(247deg)_brightness(67%)_contrast(118%)]">
        <Image
          src="/incomplete.svg"
          alt="Données en cours de récolte"
          fill
          loading="lazy"
        />
      </span>
      <span
        className={cn(
          "absolute top-full mb-1 hidden rounded px-2 py-1 text-center text-xs whitespace-nowrap text-default-grey shadow-md group-hover:block bg-white",
          align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"
        )}
      >
        Donnée en cours de récolte
        <br />
        <strong>{nbStructures}</strong> {pluralize(nbStructures, "structure")}{" "}
        comptabilisées ({structuresPercentage})
      </span>
    </span>
  );
};

type Props = {
  nbStructures: number;
  structuresPercentage: string;
  align?: "end" | null;
};
