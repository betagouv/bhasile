// Remplir la table EvenementIndesirableGrave avec les EIG venant de l'API de Démarche Numérique
// Usage: yarn script eig-fetch

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import {
  cleanDate,
  DNDossierNode,
  DNField,
  DNFieldDescriptor,
  fetchAllDossiers,
  FIELD_FRAGMENT,
  getFieldValue,
} from "../utils/demarche-numerique.util";

const prisma = createPrismaClient();

const EIG_DEMARCHE_NUMBER = 98768;

type EIGDossierNode = DNDossierNode & { champs: DNField[] };

const DNA_CODE = {
  id: "Q2hhbXAtNTAyNDgxMw==",
  label: "Code du centre",
};
const EVENEMENT_DATE = {
  id: "Q2hhbXAtNDU3MjkyMQ==",
  label: "Date de l'événement déclaré",
};
const DECLARATION_DATE = {
  id: "Q2hhbXAtMzczODE2MA==",
  label: "Date et heure de la déclaration",
};
const TYPE = {
  id: "Q2hhbXAtMzczODIzMw==",
  label:
    "Précisez la nature des faits, en vous appuyant si besoin sur le référentiel ci-dessus.",
};
const TYPE_STRUCTURE = {
  id: "Q2hhbXAtNDMzMDY0NQ==",
  label: "Type de structure",
};

const fieldValue = (
  dossier: EIGDossierNode,
  descriptor: DNFieldDescriptor
): string => getFieldValue(dossier.champs, descriptor);

const isIn303 = (dossier: EIGDossierNode): boolean =>
  fieldValue(dossier, TYPE_STRUCTURE).includes("303");

const getEIGsFromDN = async (): Promise<EIGDossierNode[]> => {
  const dossiers = await fetchAllDossiers<EIGDossierNode>({
    demarcheNumber: EIG_DEMARCHE_NUMBER,
    champsFragment: FIELD_FRAGMENT,
    label: "EIGs",
  });

  return dossiers.filter(isIn303);
};

type EIGFromAPI = {
  dnaCode: string;
  numeroDossier: string;
  evenementDate: Date;
  declarationDate: Date;
  type: string;
};

const getAllEIGs = async (): Promise<EIGFromAPI[]> => {
  const dossiers = await getEIGsFromDN();
  const appEIGs = dossiers
    .map((dossier) => {
      const dnaCode = fieldValue(dossier, DNA_CODE);
      const evenementDate = cleanDate(fieldValue(dossier, EVENEMENT_DATE));
      const declarationDate = cleanDate(fieldValue(dossier, DECLARATION_DATE));
      if (!dnaCode || !evenementDate || !declarationDate) {
        return;
      }
      return {
        dnaCode,
        numeroDossier: String(dossier.number),
        evenementDate,
        declarationDate,
        type: fieldValue(dossier, TYPE),
      };
    })
    .filter((eig): eig is EIGFromAPI => eig !== undefined)
    .filter((eig) => eig.dnaCode.length === 5);

  console.log("📝", appEIGs.length, "EIGs récupérés");

  return appEIGs;
};

const eigs = await getAllEIGs();
const existingDnaCodes = new Set(
  (
    await prisma.dna.findMany({
      select: { code: true },
    })
  ).map((dna) => dna.code)
);

const ignoredDnaCodes = new Set<string>();

for (const eig of eigs) {
  if (!existingDnaCodes.has(eig.dnaCode)) {
    ignoredDnaCodes.add(eig.dnaCode);
    continue;
  }
  await prisma.evenementIndesirableGrave.upsert({
    where: { numeroDossier: eig.numeroDossier },
    update: {},
    create: {
      dnaCode: eig.dnaCode,
      numeroDossier: eig.numeroDossier,
      evenementDate: eig.evenementDate,
      declarationDate: eig.declarationDate,
      type: eig.type,
    },
  });
}

if (ignoredDnaCodes.size) {
  console.log(
    `⚠️ ${ignoredDnaCodes.size} code(s) DNA absent(s) de la base, EIGs non importés :`,
    [...ignoredDnaCodes].sort().join(", ")
  );
}
