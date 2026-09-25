import type { CommuneCoordinates } from "@/types/adresse.type";

import type { NormalizedLocalisation } from "./adresse.util";

const BAN_SEARCH_URL = "https://data.geopf.fr/geocodage/search/";
const BAN_TIMEOUT_MS = 3_000;

type BanSearchBody = {
  features?: {
    geometry: { coordinates: [number, number] };
    properties: { city: string };
  }[];
};

// Le code postal est répété dans `q` : la BAN refuse un `q` de moins de 3 caractères (« Eu », « Y »).
// Introuvable, refus ou panne : null dans tous les cas, l'adresse lève l'anomalie ADRESSE_NON_LOCALISEE.
export const searchMunicipality = async ({
  codePostal,
  commune,
}: NormalizedLocalisation): Promise<CommuneCoordinates | null> => {
  const params = new URLSearchParams({
    q: `${commune} ${codePostal}`,
    type: "municipality",
    postcode: codePostal,
    limit: "1",
  });

  try {
    const response = await fetch(`${BAN_SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(BAN_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body: BanSearchBody = await response.json();
    const feature = body.features?.[0];
    if (!feature) {
      return null;
    }
    const [longitude, latitude] = feature.geometry.coordinates;
    return { latitude, longitude, nom: feature.properties.city };
  } catch {
    return null;
  }
};
