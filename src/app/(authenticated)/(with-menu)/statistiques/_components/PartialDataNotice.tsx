import Image from "next/image";
import { ReactElement } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";

export const PartialDataNotice = (): ReactElement => {
  return (
    <CustomNotice
      severity="warning"
      description={
        <span>
          <strong>
            Dans les blocs suivants, certaines données annuelles sont récoltées
            au moment des actualisations. Seules les structures qui ont été
            actualisées sont alors comptabilisées.
          </strong>{" "}
          Tant qu’il ne s’agit pas de toutes les structures actives sur l’outil,
          chacune de ces données est marquée du symbole{" "}
          <span className="relative inline-block h-4 w-4 align-middle">
            <Image
              src="/incomplete.svg"
              alt="Statistiques partielles"
              fill
              loading="eager"
            />
          </span>{" "}
          qui précise le nombre de structure qu’elle représente.
        </span>
      }
      className="rounded-lg bg-contrast-yellow-tournesol text-action-high-yellow-tournesol [&_.fr-container]:max-w-none"
    />
  );
};
