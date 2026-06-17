import { CURRENT_YEAR } from "@/constants";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { uniqueDnaCode } from "../data/ids";
import { prisma } from "./prisma";
import {
  createStructureForTest,
  type SeededStructure,
  seedValidStructureTypologies,
} from "./structure.seed";

const FINALISATION_FORM_SLUG = "finalisation-v1";

export const SOURCE_PLACES_AUTORISEES = 10;

export type TransformationSourceInput = {
  type: StructureType;
  operateurId: number;
};

export type SeededTransformationSource = SeededStructure & {
  dnaCode: string;
  placesAutorisees: number;
};

/**
 * Marque une structure comme finalisée pour qu'elle apparaisse dans la
 * sélection des transformations (le filtre `finalised` exige un Form
 * `finalisation-v1` à `status = true`).
 */
const seedFinalisationForm = async (structureId: number): Promise<void> => {
  const formDefinition = await prisma.formDefinition.findUnique({
    where: { slug: FINALISATION_FORM_SLUG },
  });
  if (!formDefinition) {
    throw new Error(
      `FormDefinition "${FINALISATION_FORM_SLUG}" introuvable — la base de test doit être seedée (yarn prisma:seed).`
    );
  }
  await prisma.form.create({
    data: {
      structureId,
      formDefinitionId: formDefinition.id,
      status: true,
    },
  });
};

const seedContacts = async (structureId: number): Promise<void> => {
  await prisma.contact.createMany({
    data: [
      {
        structureId,
        prenom: "Jean",
        nom: "Dupont",
        role: "Directeur",
        email: "jean.dupont@example.fr",
        telephone: "0102030405",
      },
      {
        structureId,
        prenom: "Marie",
        nom: "Martin",
        role: "Référente",
        email: "marie.martin@example.fr",
        telephone: "0102030406",
      },
    ],
  });
};

const seedAntennes = async (structureId: number): Promise<void> => {
  await prisma.antenne.createMany({
    data: [
      {
        structureId,
        name: "Antenne A",
        adresse: "10 rue de l'Antenne A",
        codePostal: "75002",
        commune: "Paris",
        departement: "75",
      },
      {
        structureId,
        name: "Antenne B",
        adresse: "20 rue de l'Antenne B",
        codePostal: "75003",
        commune: "Paris",
        departement: "75",
      },
    ],
  });
};

const seedAdresses = async (structureId: number): Promise<void> => {
  for (const [index, suffix] of ["A", "B"].entries()) {
    await prisma.adresse.create({
      data: {
        structureId,
        adresse: `${index + 1} rue d'Hébergement ${suffix}`,
        codePostal: "75004",
        commune: "Paris",
        repartition: Repartition.COLLECTIF,
        placesAutorisees: SOURCE_PLACES_AUTORISEES,
        qpv: 0,
        logementSocial: 0,
        adresseTypologies: {
          create: [
            {
              year: CURRENT_YEAR,
              placesAutorisees: SOURCE_PLACES_AUTORISEES,
              qpv: 0,
              logementSocial: 0,
            },
          ],
        },
      },
    });
  }
};

/**
 * Crée une structure source finalisée et enrichie (contacts, antennes,
 * adresses + typologies, structureTypologies, DNA, FINESS, Form finalisé)
 * — utilisable comme source/cible d'une transformation : sélectionnable et
 * avec des données à pré-remplir (`copyStructureVersion` lit ces relations
 * legacy sur `Structure`).
 */
export const createTransformationSource = async (
  overrides: Partial<TransformationSourceInput> = {}
): Promise<SeededTransformationSource> => {
  const dnaCode = uniqueDnaCode();

  const structure = await createStructureForTest({
    type: overrides.type ?? StructureType.CADA,
    operateurId: overrides.operateurId ?? 1,
    dnaCodes: [{ code: dnaCode }],
  });

  await seedValidStructureTypologies(structure.id);
  await seedContacts(structure.id);
  await seedAntennes(structure.id);
  await seedAdresses(structure.id);
  await seedFinalisationForm(structure.id);

  return {
    ...structure,
    dnaCode,
    placesAutorisees: SOURCE_PLACES_AUTORISEES,
  };
};

/**
 * Crée un code DNA connu en base (référentiel) pour les flux de création,
 * où le champ DNA est en autocomplete et n'accepte qu'un code existant.
 */
export const seedKnownDnaCode = async (): Promise<string> => {
  const code = uniqueDnaCode();
  await prisma.dna.create({ data: { code } });
  return code;
};
