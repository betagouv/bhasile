// Remplir les tables de transformation avec les informations venant de l'API de Démarches Numériques
// Usage: yarn script transformation-fetch

import "dotenv/config";

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
	demarche(number: 128242) {
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

const fetchTransformationPage = async (after?: string): Promise<DNResponse> => {
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

const fetchAllTransformations = async (): Promise<DNDossierNode[]> => {
  let hasNextPage = null;
  let endCursor = undefined;
  const transformationNodes = [];
  let index = 1;
  while (hasNextPage !== false) {
    console.log(
      "📃 Récupération de la page",
      index,
      "des transformations depuis Démarches Numériques"
    );
    const DNResponse = await fetchTransformationPage(endCursor);
    hasNextPage = DNResponse.data.demarche.dossiers.pageInfo.hasNextPage;
    endCursor = DNResponse.data.demarche.dossiers.pageInfo.endCursor;
    index++;
    transformationNodes.push(...DNResponse.data.demarche.dossiers.nodes);
  }
  return transformationNodes;
};

const getTransformationsFromDN = async (): Promise<DNColumn[][]> => {
  const dossiers = await fetchAllTransformations();
  const transformations = dossiers.map((dossier) => {
    const columns = dossier.champs.flatMap((champ) => {
      return champ.columns;
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
  return transformations;
};

const getAllTransformations = async () => {
  const DNTransformations = await getTransformationsFromDN();

  console.log("📝", DNTransformations.length, "EIGs récupérés");

  return DNTransformations;
};

const transformations = await getAllTransformations();

console.log(">>>>>>>>>>><", transformations);
