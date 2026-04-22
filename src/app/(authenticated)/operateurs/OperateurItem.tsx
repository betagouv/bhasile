// import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";
import Link from "next/link";
import { ReactElement } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { StructureType } from "@/types/structure.type";

const getBadgeColor = (structureType: string): BadgeType => {
  const types: Record<string, BadgeType> = {
    CADA: "brown",
    CPH: "brown",
    CAES: "purple",
    HUDA: "purple",
    PRAHDA: "info",
  };
  return types[structureType] || "";
};

export const OperateurItem = ({
  id,
  name,
  nbStructures,
  totalPlaces,
  pourcentageParc,
  structureTypes,
}: Props): ReactElement => {
  return (
    <div className="border border-default-grey rounded-[10px] bg-white">
      <div className="flex px-6 py-4 justify-between">
        <div className="flex">
          <div className="relative h-[80] w-[80] mr-10">
            <Image src="/logo.svg" alt={`Logo ${name}`} fill loading="eager" />
          </div>
          <div className="flex-col">
            <h3 className="text-title-blue-france text-xl mb-2">{name}</h3>
            <div className="flex pb-1.5">
              {structureTypes.map((structureType) => (
                <Badge
                  key={structureType}
                  type={getBadgeColor(structureType)}
                  className="mr-2"
                >
                  {structureType}
                </Badge>
              ))}
            </div>
            {/* TODO : en attente de la migration des données de filiales en prod */}
            {/* <div className="flex items-center">
              <span className="pr-4">X filiales</span>
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-eye-line"
                size="small"
              >
                Voir les détails
              </Button>
            </div> */}
          </div>
        </div>
        <div className="flex items-center">
          <div className="border-r border-default-grey pr-4 flex flex-col items-center max-w-[130px]">
            <h3 className="text-xl mb-0.5">{nbStructures}</h3>
            <span className="text-xs text-mention-grey text-center">
              structure{nbStructures > 1 ? "s" : ""} en France
            </span>
          </div>
          <div className="border-r border-default-grey px-4 flex flex-col items-center max-w-[140px]">
            <h3 className="text-xl mb-0.5">{totalPlaces}</h3>
            <span className="text-xs text-mention-grey text-center">
              places autorisées en France
            </span>
          </div>
          <div className="pl-4 flex flex-col items-center max-w-[140px]">
            <h3 className="text-xl mb-0.5">{pourcentageParc} %</h3>
            <span className="text-xs text-mention-grey text-center">
              du parc en nombre de places
            </span>
          </div>
          <Link
            className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-line before:w-[20] before:h-[20]"
            title={`Détails de la structure ${name}`}
            href={`operateurs/${id}`}
            aria-label={`Détails de la structure ${name}`}
          />
        </div>
      </div>
    </div>
  );
};

type Props = {
  id: number;
  name: string;
  nbStructures: number;
  totalPlaces: number;
  pourcentageParc: number;
  structureTypes: StructureType[];
};
