const DN_API_URL = "https://demarche.numerique.gouv.fr/api/v2/graphql";
const PAGE_SIZE = 100;

const getDaysAgo = (days: number): Date =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export type DNColumn = {
  label: string;
  stringValue: string;
};

// L'API renvoie `Dossier.number` en Int, pas en String.
export type DNDossierNode = {
  number: number;
};

type DNResponse<TNode extends DNDossierNode> = {
  data?: {
    demarche: {
      dossiers: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        nodes: TNode[];
      };
    };
  };
  errors?: { message: string }[];
};

export type DNDossierState =
  "accepte" | "en_construction" | "en_instruction" | "refuse" | "sans_suite";

export const DEFAULT_WINDOW_TO_FETCH_DAYS = 7;

type FetchAllDossiersOptions = {
  demarcheNumber: number;
  champsFragment: string;
  label: string;
  windowToFetchDays?: number | null;
  state?: DNDossierState;
};

const resolveUpdatedSince = ({
  windowToFetchDays,
}: FetchAllDossiersOptions): Date | undefined => {
  const days =
    windowToFetchDays === undefined
      ? DEFAULT_WINDOW_TO_FETCH_DAYS
      : windowToFetchDays;

  if (days === null) {
    return undefined;
  }

  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(
      `❌ Fenêtre invalide : ${days}. Attendu un nombre entier de jours > 0, ou null pour tout récupérer.`
    );
  }

  return getDaysAgo(days);
};

const getQuery = (options: FetchAllDossiersOptions, after?: string) => {
  const { demarcheNumber, champsFragment, state } = options;
  const updatedSince = resolveUpdatedSince(options);

  const filters = [
    `first: ${PAGE_SIZE}`,
    after ? `after: "${after}"` : "",
    updatedSince ? `updatedSince: "${updatedSince.toISOString()}"` : "",
    state ? `state: ${state}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
{
	demarche(number: ${demarcheNumber}) {
		id
		title
		dossiers (${filters}) {
			pageInfo {
				endCursor
				hasNextPage
			}
			nodes {
				number
				${champsFragment}
			}
		}
	}
}
`;
};

const fetchDossiersPage = async <TNode extends DNDossierNode>(
  options: FetchAllDossiersOptions,
  after?: string
): Promise<DNResponse<TNode>> => {
  const token = process.env.DEMARCHES_NUMERIQUES_TOKEN;
  if (!token) {
    throw new Error(
      "❌ DEMARCHES_NUMERIQUES_TOKEN n'est pas défini dans l'environnement"
    );
  }

  const result = await fetch(DN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: getQuery(options, after),
    }),
  });

  if (!result.ok) {
    throw new Error(
      `❌ Démarches Numériques a répondu ${result.status} ${result.statusText}`
    );
  }

  return result.json();
};

export const fetchAllDossiers = async <TNode extends DNDossierNode>(
  options: FetchAllDossiersOptions
): Promise<TNode[]> => {
  let hasNextPage: boolean | null = null;
  let endCursor: string | undefined = undefined;
  const nodes: TNode[] = [];
  let index = 1;

  const updatedSince = resolveUpdatedSince(options);
  console.log(
    updatedSince
      ? `🗓️ Fenêtre : dossiers modifiés depuis le ${updatedSince.toLocaleDateString("fr-FR")}`
      : "🗓️ Fenêtre : aucune, tous les dossiers sont récupérés"
  );

  while (hasNextPage !== false) {
    console.log(
      "📃 Récupération de la page",
      index,
      `des ${options.label} depuis Démarches Numériques`
    );
    const response: DNResponse<TNode> = await fetchDossiersPage<TNode>(
      options,
      endCursor
    );

    if (response.errors?.length || !response.data) {
      throw new Error(
        `❌ Erreur GraphQL : ${response.errors?.map((error) => error.message).join(", ") ?? "réponse vide"}`
      );
    }

    const { pageInfo, nodes: pageNodes } = response.data.demarche.dossiers;
    hasNextPage = pageInfo.hasNextPage;
    endCursor = pageInfo.endCursor;
    index++;
    nodes.push(...pageNodes);
  }

  return nodes;
};

export const getValueByLabel = (columns: DNColumn[], label: string): string =>
  columns.find((column) => column.label === label)?.stringValue || "";

export const cleanDate = (dateValue: string): Date | null => {
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
