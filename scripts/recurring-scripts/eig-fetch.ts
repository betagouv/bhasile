// Remplir la table EvenementIndesirableGrave avec les EIG venant de l'API de Démarches Numériques
// Usage: yarn script eig-fetch eig-fetch.ts

import "dotenv/config";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";
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

const getAllEIGs = async (): Promise<
  Omit<EvenementIndesirableGrave, "id" | "createdAt" | "updatedAt">[]
> => {
  const DNEIGs = await getEIGsFromDN();
  const appEIGs = DNEIGs.map((DNEIG) => {
    const structureDnaCode = getValueByLabel(DNEIG, DNA_CODE_LABEL);
    const evenementDate = getValueByLabel(DNEIG, EVENEMENT_DATE_LABEL);
    const declarationDate = getValueByLabel(DNEIG, DECLARATION_DATE_LABEL);
    if (!structureDnaCode || !evenementDate || !declarationDate) {
      return;
    }
    return {
      structureDnaCode,
      dnaCode: structureDnaCode,
      numeroDossier: getValueByLabel(DNEIG, NUMERO_DOSSIER_LABEL).toString(),
      evenementDate: new Date(cleanDate(evenementDate)!),
      declarationDate: new Date(cleanDate(declarationDate)!),
      type: getValueByLabel(DNEIG, TYPE_LABEL).toString(),
    };
  })
    .filter((appEIG) => appEIG !== undefined)
    .filter((appEIG) => appEIG?.structureDnaCode?.length === 5);
  console.log(appEIGs);
  console.log("📝", appEIGs.length, "EIGs récupérés");
  return appEIGs;
};

const structureDnaCodes = await prisma.structure.findMany({
  select: { dnaCode: true },
});
const dnaCodes = structureDnaCodes.map(
  (structureDnaCode) => structureDnaCode.dnaCode
);

for (const EIG of await getAllEIGs()) {
  if (dnaCodes.includes(EIG.structureDnaCode)) {
    await prisma.evenementIndesirableGrave.upsert({
      where: { numeroDossier: EIG.numeroDossier || "" },
      update: {},
      create: EIG,
    });
  }
}
