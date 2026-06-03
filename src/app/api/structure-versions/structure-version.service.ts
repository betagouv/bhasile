import { recursivelySerializeDates } from "@/app/utils/date.util";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureVersionApiRead } from "@/schemas/api/transformation.schema";
import { PublicType, StructureType } from "@/types/structure.type";

import { getAdressesApiRead } from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import type { StructureDbDetails } from "../structures/structure.db.type";
import { StructureVersionDbDetails } from "./structure-version.db.type";

const mapVersionScalars = (
  source: StructureDbDetails | StructureVersionDbDetails
): Pick<
  StructureVersionApiType,
  | "type"
  | "public"
  | "adresseAdministrative"
  | "codePostalAdministratif"
  | "communeAdministrative"
  | "departementAdministratif"
  | "latitude"
  | "longitude"
  | "nom"
  | "creationDate"
  | "date303"
  | "lgbt"
  | "fvvTeh"
  | "notes"
  | "nomOfii"
  | "directionTerritoriale"
> => ({
  type: source.type
    ? StructureType[source.type as keyof typeof StructureType]
    : undefined,
  public: source.public
    ? PublicType[source.public as string as keyof typeof PublicType]
    : undefined,
  adresseAdministrative: source.adresseAdministrative ?? undefined,
  codePostalAdministratif: source.codePostalAdministratif ?? undefined,
  communeAdministrative: source.communeAdministrative ?? undefined,
  departementAdministratif: source.departementAdministratif ?? undefined,
  latitude: source.latitude?.toString() ?? undefined,
  longitude: source.longitude?.toString() ?? undefined,
  nom: source.nom ?? undefined,
  creationDate: source.creationDate?.toISOString() ?? undefined,
  date303: source.date303?.toISOString() ?? undefined,
  lgbt: source.lgbt ?? undefined,
  fvvTeh: source.fvvTeh ?? undefined,
  notes: source.notes ?? undefined,
  nomOfii: source.nomOfii ?? undefined,
  directionTerritoriale: source.directionTerritoriale ?? undefined,
});

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

  const antennes = getAntennesApiRead(version.antennes);
  const isMultiAntenne = (version.antennes?.length ?? 0) > 0;
  const isMultiDna =
    (version.dnaStructures?.length ?? 0) > 1 ||
    (version.finesses?.length ?? 0) > 1;

  return recursivelySerializeDates({
    ...version,
    ...mapVersionScalars(version),
    antennes,
    isMultiAntenne,
    isMultiDna,
    effectiveDate: version.effectiveDate ?? undefined,
    adresseAdministrativeComplete: adresseAdministrativeComplete || undefined,
  }) as StructureVersionApiRead;
};

export const copyStructureVersion = (
  structure: StructureDbDetails,
  overrides: Partial<StructureVersionApiType> = {}
): StructureVersionApiType => ({
  ...mapVersionScalars(structure),
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
