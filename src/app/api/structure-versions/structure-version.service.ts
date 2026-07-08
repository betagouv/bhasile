import { recursivelySerializeDates } from "@/app/utils/date.util";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureVersionApiRead } from "@/schemas/api/transformation.schema";
import { PublicType } from "@/types/structure.type";

import {
  buildAdresseAdministrativeComplete,
  getAdressesApiRead,
} from "../adresses/adresse.util";
import { getAntennesApiRead } from "../antennes/antenne.util";
import { getStructureFinessesApiRead } from "../finesses/finess.util";
import type { StructureDbDetails } from "../structures/structure.db.type";
import { getTypeBati } from "../structures/structure.util";
import { StructureVersionDbTransformation } from "./structure-version.db.type";

const mapVersionFields = (
  source: StructureDbDetails | StructureVersionDbTransformation
): Pick<
  StructureVersionApiType,
  | "public"
  | "adresseAdministrative"
  | "codePostalAdministratif"
  | "communeAdministrative"
  | "departementAdministratif"
  | "latitude"
  | "longitude"
  | "nom"
  | "notes"
  | "nomOfii"
  | "directionTerritoriale"
> => ({
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
  notes: source.notes ?? undefined,
  nomOfii: source.nomOfii ?? undefined,
  directionTerritoriale: source.directionTerritoriale ?? undefined,
});

export const dbStructureVersionToApiRead = (
  version: StructureVersionDbTransformation
): StructureVersionApiRead => {
  const adresseAdministrativeComplete =
    buildAdresseAdministrativeComplete(version);

  const antennes = getAntennesApiRead(version.antennes);
  const adresses = getAdressesApiRead(version.adresses);
  const structureFinesses = getStructureFinessesApiRead(
    version.structureFinesses
  );
  const typeBati = getTypeBati(version);
  const isMultiAntenne = (version.antennes?.length ?? 0) > 0;
  const isMultiDna =
    (version.dnaStructures?.length ?? 0) > 1 ||
    (version.structureFinesses?.length ?? 0) > 1;

  return recursivelySerializeDates({
    ...version,
    ...mapVersionFields(version),
    antennes,
    adresses,
    structureFinesses,
    typeBati,
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
  ...mapVersionFields(structure),
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
  // TODO: simplify once finess.code is mandatory in db
  structureFinesses: structure.structureFinesses.flatMap((structureFiness) =>
    structureFiness.finess.code
      ? [
          {
            description: structureFiness.description ?? undefined,
            finess: {
              code: structureFiness.finess.code,
            },
          },
        ]
      : []
  ),
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
  })),
  dnaStructures: structure.dnaStructures.map((dnaStructure) => ({
    description: dnaStructure.description ?? undefined,
    dna: {
      code: dnaStructure.dna.code,
    },
    startDate: dnaStructure.startDate?.toISOString() ?? undefined,
    endDate: dnaStructure.endDate?.toISOString() ?? undefined,
  })),
  ...overrides,
});
