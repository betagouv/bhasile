import Link from "next/link";
import { ReactElement } from "react";

import { formatPlural } from "@/app/utils/string.util";
import { CommuneMapPoint, CommuneStructure } from "@/types/structure-list.type";

export const CommunePopupContent = ({ commune }: Props): ReactElement => (
  <div className="w-md max-w-[80vw]">
    <p className="uppercase font-bold text-title-blue-france mb-2">
      {commune.nom}
    </p>
    <ul className="list-none p-0 m-0 max-h-64 overflow-y-auto">
      {commune.structures.map((structure) => (
        <li
          key={structure.id}
          className="p-0 border-t first:border-t-0 border-default-grey"
        >
          <Link
            href={getStructureHref(structure)}
            className="flex items-center gap-3 py-3 bg-none! text-inherit"
          >
            <span
              className="fr-icon-building-line text-title-blue-france"
              aria-hidden
            />
            <span className="flex-1 min-w-0">
              <span className="block font-bold uppercase text-title-blue-france truncate">
                {structure.nom ?? structure.codeBhasile}
              </span>
              <span className="block text-sm truncate">
                {getStructureSubtitle(structure)}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-contrast-grey px-3 py-1 text-sm text-title-blue-france">
              {formatPlural(structure.places, "place")}
            </span>
            <span
              className="fr-icon-arrow-right-line text-title-blue-france"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

type Props = {
  commune: CommuneMapPoint;
};

const getStructureHref = (structure: CommuneStructure): string =>
  structure.isFinalised
    ? `/structures/${structure.id}`
    : `/structures/${structure.id}/finalisation/01-identification`;

const getStructureSubtitle = (structure: CommuneStructure): string =>
  [
    structure.codeBhasile,
    [structure.type, structure.operateurLabel].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" – ");
