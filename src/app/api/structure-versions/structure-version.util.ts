import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";

export const getStructureVersionApiRead = <T extends StructureVersionApiType>(
  version: T
) => ({
  ...version,
  effectiveDate: version.effectiveDate ?? undefined,
  type: version.type ?? undefined,
  public: version.public ?? undefined,
  adresseAdministrative: version.adresseAdministrative ?? undefined,
  codePostalAdministratif: version.codePostalAdministratif ?? undefined,
  communeAdministrative: version.communeAdministrative ?? undefined,
  departementAdministratif: version.departementAdministratif ?? undefined,
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
});
