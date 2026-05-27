import { recursivelySerializeDates } from "@/app/utils/date.util";
import { StructureVersionApiRead } from "@/schemas/api/transformation.schema";
import { PublicType } from "@/types/structure.type";

import { StructureVersionDbDetails } from "./structure-version.db.type";

export const dbStructureVersionToApiRead = (
  version: StructureVersionDbDetails
): StructureVersionApiRead => {
  const adresseAdministrativeComplete = [
    version.adresseAdministrative,
    version.codePostalAdministratif,
    version.communeAdministrative,
    version.departementAdministratif,
  ]
    .filter(Boolean)
    .join(" ");

  return recursivelySerializeDates({
    ...version,
    effectiveDate: version.effectiveDate ?? undefined,
    type: version.type ?? undefined,
    public: version.public
      ? (PublicType[version.public as string as keyof typeof PublicType] ??
        undefined)
      : undefined,
    adresseAdministrative: version.adresseAdministrative ?? undefined,
    codePostalAdministratif: version.codePostalAdministratif ?? undefined,
    communeAdministrative: version.communeAdministrative ?? undefined,
    departementAdministratif: version.departementAdministratif ?? undefined,
    adresseAdministrativeComplete: adresseAdministrativeComplete || undefined,
    latitude: version.latitude ?? undefined,
    longitude: version.longitude ?? undefined,
    nom: version.nom ?? undefined,
    creationDate: version.creationDate ?? undefined,
    date303: version.date303 ?? undefined,
    lgbt: version.lgbt ?? undefined,
    fvvTeh: version.fvvTeh ?? undefined,
    notes: version.notes ?? undefined,
    nomOfii: version.nomOfii ?? undefined,
    directionTerritoriale: version.directionTerritoriale ?? undefined,
  }) as StructureVersionApiRead;
};
