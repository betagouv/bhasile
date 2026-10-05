import Image from "next/image";
import { ReactElement } from "react";

export const IncompleteDataIndicator = ({
  nbStructures,
  structuresPercentage,
}: Props): ReactElement => {
  return (
    <span className="group relative inline-flex items-center border-b border-dashed z-5">
      <span className="relative inline-block h-3 w-3 align-middle filter-[invert(9%)_sepia(100%)_saturate(7080%)_hue-rotate(247deg)_brightness(67%)_contrast(118%)]">
        <Image
          src="/incomplete.svg"
          alt="Données en cours de récolte"
          fill
          loading="lazy"
        />
      </span>
      <span className="absolute top-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs shadow-md group-hover:block text-default-grey bg-white text-center">
        Donnée en cours de récolte
        <br />
        <strong>{nbStructures}</strong> structures comptabilisées (
        {structuresPercentage}%)
      </span>
    </span>
  );
};

type Props = {
  nbStructures: number;
  structuresPercentage: number;
};
