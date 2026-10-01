import { getDepartementFromCodePostal } from "@/app/utils/adresse.util";
import { BAN_SEARCH_URL } from "@/constants";
import type { CommuneCoordinates } from "@/types/adresse.type";

import type { NormalizedLocalisation } from "./adresse.util";

const BAN_TIMEOUT_MS = 3_000;
const BAN_CANDIDATES_LIMIT = "20";

type AddressCoordinates = {
  latitude: number | undefined;
  longitude: number | undefined;
};

type BanSearchBody = {
  features?: {
    geometry: { coordinates: [number, number] };
    properties: { city: string; citycode: string };
  }[];
};

// Le code postal ne sert qu'à borner le département : en filtre ou dans `q`, il fait gagner la commune
// qui le porte face à celle saisie (« Villeneuve-Saint-Georges 94290 » donnait Villeneuve-le-Roi).
// Il n'entre dans `q` que pour les noms trop courts pour la BAN (« Eu », « Y » : 3 caractères minimum).
// Introuvable, refus ou panne : null dans tous les cas, l'adresse lève l'anomalie ADRESSE_NON_LOCALISEE.
export const searchMunicipality = async ({
  codePostal,
  commune,
}: NormalizedLocalisation): Promise<CommuneCoordinates | null> => {
  const params = new URLSearchParams({
    q: commune.length < 3 ? `${commune} ${codePostal}` : commune,
    type: "municipality",
    limit: BAN_CANDIDATES_LIMIT,
  });
  const departement = getDepartementFromCodePostal(codePostal);

  try {
    const response = await fetch(`${BAN_SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(BAN_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body: BanSearchBody = await response.json();
    const feature = body.features?.find(({ properties }) =>
      properties.citycode.replace(/^2[AB]/, "20").startsWith(departement)
    );
    if (!feature) {
      return null;
    }
    const [longitude, latitude] = feature.geometry.coordinates;
    return { latitude, longitude, nom: feature.properties.city };
  } catch {
    return null;
  }
};

export const searchAddress = async (
  address: string
): Promise<AddressCoordinates> => {
  const result = await fetch(
    `${BAN_SEARCH_URL}?q=${address}&autocomplete=0&limit=1`
  );
  const data = await result.json();
  const coordinates = data?.features?.[0]?.geometry?.coordinates;
  return {
    longitude: coordinates?.[0],
    latitude: coordinates?.[1],
  };
};
