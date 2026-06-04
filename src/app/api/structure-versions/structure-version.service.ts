import { recursivelySerializeDates } from "@/app/utils/date.util";
import { StructureVersionApiRead } from "@/schemas/api/transformation.schema";
import { PublicType } from "@/types/structure.type";

import { buildAdresseAdministrativeComplete } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { StructureVersionDbDetails } from "./structure-version.db.type";

export const dbStructureVersionToApiRead = (
  version: StructureVersionDbDetails
): StructureVersionApiRead => {
  const adresseAdministrativeComplete =
    buildAdresseAdministrativeComplete(version);

  const antennes = getAntennesApiRead(version.antennes);
  const isMultiAntenne = (version.antennes?.length ?? 0) > 0;
  const isMultiDna =
    (version.dnaStructures?.length ?? 0) > 1 ||
    (version.finesses?.length ?? 0) > 1;

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
    antennes,
    isMultiAntenne,
    isMultiDna,
  }) as StructureVersionApiRead;
};
