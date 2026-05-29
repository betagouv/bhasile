import { recursivelySerializeDates } from "@/app/utils/date.util";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureVersionApiRead } from "@/schemas/api/transformation.schema";
import { PublicType, StructureType } from "@/types/structure.type";

import { getAdressesApiRead } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import type { StructureDbDetails } from "../structures/structure.db.type";
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

export const mapStructureToVersionInput = (
  structure: StructureDbDetails,
  overrides: Partial<StructureVersionApiType> = {}
): StructureVersionApiType => ({
  type: structure.type
    ? StructureType[structure.type as keyof typeof StructureType]
    : undefined,
  public: structure.public
    ? PublicType[structure.public as keyof typeof PublicType]
    : undefined,
  adresseAdministrative: structure.adresseAdministrative ?? undefined,
  codePostalAdministratif: structure.codePostalAdministratif ?? undefined,
  communeAdministrative: structure.communeAdministrative ?? undefined,
  departementAdministratif: structure.departementAdministratif ?? undefined,
  latitude: structure.latitude?.toString() ?? undefined,
  longitude: structure.longitude?.toString() ?? undefined,
  nom: structure.nom ?? undefined,
  creationDate: structure.creationDate?.toISOString() ?? undefined,
  date303: structure.date303?.toISOString() ?? undefined,
  lgbt: structure.lgbt ?? undefined,
  fvvTeh: structure.fvvTeh ?? undefined,
  notes: structure.notes ?? undefined,
  nomOfii: structure.nomOfii ?? undefined,
  directionTerritoriale: structure.directionTerritoriale ?? undefined,
  contacts: structure.contacts.map((contact) => ({
    prenom: contact.prenom ?? undefined,
    nom: contact.nom ?? undefined,
    telephone: contact.telephone ?? undefined,
    email: contact.email ?? undefined,
    role: contact.role ?? undefined,
    perimetre: contact.perimetre ?? undefined,
  })),
  antennes: (getAntennesApiRead(structure.antennes) ?? []).map((antenne) => ({
    name: antenne.name,
    adresse: antenne.adresse,
    codePostal: antenne.codePostal,
    commune: antenne.commune,
    departement: antenne.departement,
  })),
  adresses: (getAdressesApiRead(structure.adresses) ?? []).map((adresse) => ({
    adresse: adresse.adresse,
    codePostal: adresse.codePostal,
    commune: adresse.commune,
    repartition: adresse.repartition,
    adresseTypologies: adresse.adresseTypologies.map((typologie) => ({
      placesAutorisees: typologie.placesAutorisees,
      year: typologie.year,
      qpv: typologie.qpv,
      logementSocial: typologie.logementSocial,
    })),
  })),
  structureTypologies: structure.structureTypologies.map((typologie) => ({
    year: typologie.year,
    placesAutorisees: typologie.placesAutorisees ?? undefined,
    pmr: typologie.pmr ?? undefined,
    lgbt: typologie.lgbt ?? undefined,
    fvvTeh: typologie.fvvTeh ?? undefined,
    placesACreer: typologie.placesACreer,
    placesAFermer: typologie.placesAFermer,
    echeancePlacesACreer: typologie.echeancePlacesACreer?.toISOString(),
    echeancePlacesAFermer: typologie.echeancePlacesAFermer?.toISOString(),
  })),
  dnaStructures: structure.dnaStructures.map((dnaStructure) => ({
    dna: {
      code: dnaStructure.dna.code,
      description: dnaStructure.dna.description ?? undefined,
    },
    startDate: dnaStructure.startDate?.toISOString() ?? undefined,
    endDate: dnaStructure.endDate?.toISOString() ?? undefined,
  })),
  ...overrides,
});
