import Image from "next/image";
import Link from "next/link";
import { ReactElement } from "react";

export const StatsCta = (): ReactElement => {
  return (
    <div className="bg-alt-blue-france border border-default-grey rounded-[10px] border-solid flex">
      <div className="relative h-[154] w-[730]">
        <Image
          src="/stats.svg"
          alt="Statistiques illustration"
          fill
          loading="eager"
        />
      </div>
      <div className="text-right p-5">
        <div className="text-action-high-blue-france pb-2">
          Pour visualiser l’évolution des <strong>places indisponibles</strong>,
          des <strong>EIG</strong>, du cumul des{" "}
          <strong>excédents et déficits</strong>... de cet opérateurà l’échelle
          départementale, régionale et nationale
        </div>
        <Link href="/statistiques" className="fr-btn">
          Consultez l’onglet Statistiques
          <span className="fr-icon-arrow-right-line" />
        </Link>
      </div>
    </div>
  );
};
