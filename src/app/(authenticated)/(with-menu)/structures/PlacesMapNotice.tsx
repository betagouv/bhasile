import { ReactElement } from "react";

import { getCommunePoints } from "@/app/api/structures/structure.service";
import { formatPlural } from "@/app/utils/string.util";
import { StructuresQuery } from "@/types/structure-list.type";

export const PlacesMapNotice = async ({
  query,
}: {
  query: StructuresQuery;
}): Promise<ReactElement | null> => {
  const { nonLocalisedPlaces, nonRepresentedStructuresCount } =
    await getCommunePoints(query);
  const notices = [
    nonLocalisedPlaces > 0 &&
      `${formatPlural(nonLocalisedPlaces, "place")} dont la commune n’a pas pu être localisée ${nonLocalisedPlaces > 1 ? "n’apparaissent pas" : "n’apparaît pas"} sur la carte.`,
    nonRepresentedStructuresCount > 0 &&
      `${formatPlural(nonRepresentedStructuresCount, "structure")} sans adresse d’hébergement localisée ${nonRepresentedStructuresCount > 1 ? "ne sont pas représentées" : "n’est pas représentée"}.`,
    query.departements &&
      "Le filtre porte sur le département d’autorisation des structures : certaines places peuvent se trouver hors de ce périmètre.",
  ].filter((notice): notice is string => Boolean(notice));

  if (notices.length === 0) {
    return null;
  }

  return (
    <div className="ml-auto mr-6 mt-2 px-3 py-2 bg-white text-sm text-mention-grey w-fit max-w-[40rem]">
      {notices.map((notice) => (
        <p key={notice} className="text-sm mb-0">
          {notice}
        </p>
      ))}
    </div>
  );
};
