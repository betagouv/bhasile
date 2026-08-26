import Image from "next/image";
import { ReactElement } from "react";

import { formatDate } from "@/app/utils/date.util";
import { useStructureContext } from "@/contexts/StructureContext";

export const OfiiDisclaimer = ({ showOfiiData }: Props): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <div className="flex items-center text-right">
      {!showOfiiData ? (
        <span className="text-title-blue-france text-xs">
          Pas de données OFII disponibles
        </span>
      ) : (
        <span className="text-title-blue-france text-xs ">
          Données mensuelles de l’OFII
          <span className="italic block">
            mises à jour le {formatDate(structure.activites![0].date)}
          </span>
        </span>
      )}

      <div className="relative h-[38] w-[68]">
        <Image
          src="/ofii.webp"
          alt="Logo de l'OFII"
          fill
          sizes="(min-width: 91px)"
          loading="lazy"
        />
      </div>
    </div>
  );
};

type Props = {
  showOfiiData: boolean;
};
