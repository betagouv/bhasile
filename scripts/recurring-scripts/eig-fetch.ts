// Remplir la table EvenementIndesirableGrave avec les EIG venant de l'API de Démarches Numériques
// Usage: yarn script eig-fetch eig-fetch.ts

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

type DNResponse = {
  data: {
    demarche: {
      dossiers: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        nodes: DNDossierNode[];
      };
    };
  };
};

type DNColumn = {
  label: string;
  stringValue: string;
};

type DNChamp = {
  columns: DNColumn[];
};

type DNDossierNode = {
  number: string;
  champs: DNChamp[];
};

const getQuery = (after?: string) => `
{ 
	demarche(number: 98768) {
		id
		title
		dossiers (first: 100 ${after ? `after: "${after}"` : ""}) {
			pageInfo {
				endCursor
        hasNextPage
			}
			nodes {
        number
				champs {
					columns {
						label
						stringValue
					}
				}
			}
		}
	}
}
`;

const fetchEIGPage = async (after?: string): Promise<DNResponse> => {
  const result = await fetch(
    "https://demarche.numerique.gouv.fr/api/v2/graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEMARCHES_SIMPLIFIEES_TOKEN}`,
      },
      body: JSON.stringify({ query: getQuery(after) }),
    }
  );
  return result.json();
};

const fetchAllEigs = async (): Promise<DNDossierNode[]> => {
  let hasNextPage = null;
  let endCursor = undefined;
  const eigNodes = [];
  let index = 1;
  while (hasNextPage !== false) {
    console.log(
      "📃 Récupération de la page",
      index,
      "des EIGs depuis Démarches Numériques"
    );
    const DNResponse = await fetchEIGPage(endCursor);
    hasNextPage = DNResponse.data.demarche.dossiers.pageInfo.hasNextPage;
    endCursor = DNResponse.data.demarche.dossiers.pageInfo.endCursor;
    index++;
    eigNodes.push(...DNResponse.data.demarche.dossiers.nodes);
  }
  return eigNodes;
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

const isIn303 = (dossier: DNDossierNode): boolean | null => {
  const columns = dossier.champs.flatMap((champ) => champ.columns);
  let is303 = null;
  columns.forEach((column) => {
    if (
      column.label === "Type de structure" &&
      column.stringValue.includes("303")
    ) {
      is303 = true;
    }
  });
  return is303;
};

const getEIGsFromDN = async (): Promise<DNColumn[][]> => {
  const dossiers = await fetchAllEigs();
  const EIGs = dossiers.filter(isIn303).map((dossier) => {
    const columns = dossier.champs.flatMap((champ) => {
      return champ.columns.filter((column) => {
        return fieldsToKeep.includes(column.label);
      });
    });
    columns.push({
      label: "ID",
      stringValue: dossier.number,
    });
    const values = columns.flatMap((column) => {
      return column;
    });
    return values;
  });
  return EIGs;
};

const getValueByLabel = (DNEIG: DNColumn[], label: string): string => {
  const field = DNEIG.find((DNEIGField) => DNEIGField.label === label);
  return field?.stringValue || "";
};

const cleanDate = (dateValue: string): Date | null => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  if (year < 1900 || year > 2100) {
    return null;
  }

  return date;
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
    const evenementDate = getValueByLabel(DNEIG, EVENEMENT_DATE_LABEL);
    const declarationDate = getValueByLabel(DNEIG, DECLARATION_DATE_LABEL);
    if (!dnaCode || !evenementDate || !declarationDate) {
      return;
    }
    return {
      dnaCode,
      numeroDossier: getValueByLabel(DNEIG, NUMERO_DOSSIER_LABEL).toString(),
      evenementDate: new Date(cleanDate(evenementDate)!),
      declarationDate: new Date(cleanDate(declarationDate)!),
      type: getValueByLabel(DNEIG, TYPE_LABEL).toString(),
    };
  })
    .filter((eig): eig is EIGFromAPI => eig !== undefined)
    .filter((eig) => eig.dnaCode.length === 5);
  console.log(appEIGs);
  console.log("📝", appEIGs.length, "EIGs récupérés");
  return appEIGs;
};

const buildStructureIdByDnaCode = async (
  dnaCodes: string[]
): Promise<Map<string, number>> => {
  const uniqueCodes = [...new Set(dnaCodes.filter(Boolean))];
  if (uniqueCodes.length === 0) {
    return new Map();
  }

  const dnas = await prisma.dna.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });
  const dnaStructures = await prisma.dnaStructure.findMany({
    where: { dnaId: { in: dnas.map((d) => d.id) } },
    select: { dnaId: true, structureId: true },
  });
  const dnaIdToCode = new Map(dnas.map((d) => [d.id, d.code]));
  const map = new Map<string, number>();
  for (const ds of dnaStructures) {
    const code = dnaIdToCode.get(ds.dnaId);
    if (code) {
      map.set(code, ds.structureId);
    }
  }
  return map;
};

const eigs = await getAllEIGs();
const structureIdByDnaCode = await buildStructureIdByDnaCode(
  eigs.map((e) => e.dnaCode)
);

for (const eig of eigs) {
  const structureId = structureIdByDnaCode.get(eig.dnaCode);
  if (structureId == null) {
    continue;
  }
  await prisma.evenementIndesirableGrave.upsert({
    where: { numeroDossier: eig.numeroDossier },
    update: {},
    create: {
      structureId,
      structureDnaCode: null,
      dnaCode: eig.dnaCode,
      numeroDossier: eig.numeroDossier,
      evenementDate: eig.evenementDate,
      declarationDate: eig.declarationDate,
      type: eig.type,
    },
  });
}
