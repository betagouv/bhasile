import "dotenv/config";

import { EvenementIndesirableGrave } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

type DSResponse = {
  data: {
    demarche: {
      dossiers: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        nodes: DSDossierNode[];
      };
    };
  };
};

type DSColumn = {
  label: string;
  stringValue: string;
};

type DSChamp = {
  columns: DSColumn[];
};

type DSDossierNode = {
  number: string;
  champs: DSChamp[];
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

const fetchEIGPage = async (after?: string): Promise<DSResponse> => {
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

const fetchAllEigs = async (): Promise<DSDossierNode[]> => {
  let hasNextPage = null;
  let endCursor = undefined;
  const eigNodes = [];
  let index = 1;
  while (hasNextPage !== false) {
    console.log(
      "📃 Récupération de la page",
      index,
      "des EIGs depuis Démarches Simplifiées"
    );
    const DSResponse = await fetchEIGPage(endCursor);
    hasNextPage = DSResponse.data.demarche.dossiers.pageInfo.hasNextPage;
    endCursor = DSResponse.data.demarche.dossiers.pageInfo.endCursor;
    index++;
    eigNodes.push(...DSResponse.data.demarche.dossiers.nodes);
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

const isIn303 = (dossier: DSDossierNode): boolean | null => {
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

const getEIGsFromDS = async (): Promise<DSColumn[][]> => {
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

const getValueByLabel = (DSEIG: DSColumn[], label: string): string => {
  const field = DSEIG.find((DSEIGField) => DSEIGField.label === label);
  return field?.stringValue || "";
};

const getAllEIGs = async (): Promise<
  Omit<EvenementIndesirableGrave, "id" | "createdAt" | "updatedAt">[]
> => {
  const DSEIGs = await getEIGsFromDS();
  const appEIGs = DSEIGs.map((DSEIG) => {
    const structureDnaCode = getValueByLabel(DSEIG, DNA_CODE_LABEL);
    if (!structureDnaCode) {
      return;
    }
    return {
      structureDnaCode,
      numeroDossier: getValueByLabel(DSEIG, NUMERO_DOSSIER_LABEL),
      evenementDate: new Date(getValueByLabel(DSEIG, EVENEMENT_DATE_LABEL)),
      declarationDate: new Date(getValueByLabel(DSEIG, DECLARATION_DATE_LABEL)),
      type: getValueByLabel(DSEIG, TYPE_LABEL).toString(),
    };
  })
    .filter((appEIG) => appEIG !== undefined)
    .filter((appEIG) => appEIG?.structureDnaCode?.length === 5);
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
      where: { numeroDossier: EIG.numeroDossier },
      update: EIG,
      create: EIG,
    });
  }
}
