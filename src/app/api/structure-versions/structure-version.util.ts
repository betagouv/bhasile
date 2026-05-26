import { PublicType } from "@/types/structure.type";

import { StructureVersionDb } from "./structure-version.db.type";

export const getStructureVersionApiRead = (version: StructureVersionDb) => ({
  ...version,
  effectiveDate: version.effectiveDate ?? undefined,
  type: version.type ?? undefined,
  public: version.public
    ? PublicType[version.public as string as keyof typeof PublicType]
    : undefined,
  adresseAdministrative: version.adresseAdministrative ?? undefined,
  codePostalAdministratif: version.codePostalAdministratif ?? undefined,
  communeAdministrative: version.communeAdministrative ?? undefined,
  departementAdministratif: version.departementAdministratif ?? undefined,
  adresseAdministrativeComplete: [
    version.adresseAdministrative,
    version.codePostalAdministratif,
    version.communeAdministrative,
    version.departementAdministratif,
  ]
    .filter(Boolean)
    .join(" "),
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
  operateur: version.structure?.operateur ?? undefined,
});
