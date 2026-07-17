// Remplir la table EvenementIndesirableGrave avec les EIG venant de l'API de Démarches Numériques
// Usage: yarn script eig-fetch

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import {
  cleanDate,
  DNColumn,
  DNDossierNode,
  fetchAllDossiers,
  getValueByLabel,
} from "../utils/demarches-numeriques.util";

const prisma = createPrismaClient();

const EIG_DEMARCHE_NUMBER = 98768;

type EIGDossierNode = DNDossierNode & {
  champs: { columns: DNColumn[] }[];
};

const DNA_CODE_LABEL = "Code du centre";
const NUMERO_DOSSIER_LABEL = "ID";
const EVENEMENT_DATE_LABEL = "Date de l'événement déclaré";
const DECLARATION_DATE_LABEL = "Date et heure de la déclaration";
const TYPE_LABEL =
  "Précisez la nature des faits, en vous appuyant si besoin sur le référentiel ci-dessus.";

const fieldsToKeep = [
  DNA_CODE_LABEL,
  EVENEMENT_DATE_LABEL,
  DECLARATION_DATE_LABEL,
  TYPE_LABEL,
];

const isIn303 = (dossier: EIGDossierNode): boolean =>
  dossier.champs
    .flatMap((champ) => champ.columns)
    .some(
      (column) =>
        column.label === "Type de structure" &&
        column.stringValue.includes("303")
    );

const getEIGsFromDN = async (): Promise<DNColumn[][]> => {
  const dossiers = await fetchAllDossiers<EIGDossierNode>({
    demarcheNumber: EIG_DEMARCHE_NUMBER,
    champsFragment: `champs {
					columns {
						label
						stringValue
					}
				}`,
    label: "EIGs",
  });

  return dossiers.filter(isIn303).map((dossier) => {
    const columns = dossier.champs.flatMap((champ) =>
      champ.columns.filter((column) => fieldsToKeep.includes(column.label))
    );
    columns.push({
      label: NUMERO_DOSSIER_LABEL,
      stringValue: String(dossier.number),
    });
    return columns;
  });
};

type EIGFromAPI = {
  dnaCode: string;
  numeroDossier: string;
  evenementDate: Date;
  declarationDate: Date;
  type: string;
};

const getAllEIGs = async (): Promise<EIGFromAPI[]> => {
  const DNEIGs = await getEIGsFromDN();
  const appEIGs = DNEIGs.map((DNEIG) => {
    const dnaCode = getValueByLabel(DNEIG, DNA_CODE_LABEL);
    const evenementDate = cleanDate(
      getValueByLabel(DNEIG, EVENEMENT_DATE_LABEL)
    );
    const declarationDate = cleanDate(
      getValueByLabel(DNEIG, DECLARATION_DATE_LABEL)
    );
    if (!dnaCode || !evenementDate || !declarationDate) {
      return;
    }
    return {
      dnaCode,
      numeroDossier: getValueByLabel(DNEIG, NUMERO_DOSSIER_LABEL),
      evenementDate,
      declarationDate,
      type: getValueByLabel(DNEIG, TYPE_LABEL),
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
