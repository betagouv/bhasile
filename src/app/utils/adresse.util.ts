import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const getCoordinates = async (address: string): Promise<Coordinates> => {
  const result = await fetch(
    `https://data.geopf.fr/geocodage/search/?q=${address}&autocomplete=0&limit=1`
  );
  const data = await result.json();
  const coordinates = data?.features?.[0]?.geometry?.coordinates;
  return {
    longitude: coordinates?.[0],
    latitude: coordinates?.[1],
  };
};

export const transformFormAdressesToApiAdresses = (
  adresses: FormAdresse[] = [],
  dnaCode?: string
): AdresseApiType[] => {
  if (!adresses) {
    return [];
  }
  return adresses
    .filter(
      (adresse) =>
        adresse.adresse !== "" &&
        adresse.codePostal !== "" &&
        adresse.commune !== ""
    )
    .filter((adresse) => adresse.structureDnaCode || dnaCode)
    .map((adresse) => {
      return {
        id: adresse.id,
        structureDnaCode: adresse.structureDnaCode || (dnaCode as string),
        adresse: adresse.adresse,
        codePostal: adresse.codePostal,
        commune: adresse.commune,
        repartition: adresse.repartition,
        adresseTypologies:
          adresse.adresseTypologies?.map((adresseTypologie) => ({
            ...adresseTypologie,
            placesAutorisees: Number(adresseTypologie.placesAutorisees),
            logementSocial: adresseTypologie.logementSocial
              ? Number(adresseTypologie.placesAutorisees)
              : 0,
            qpv: adresseTypologie.qpv
              ? Number(adresseTypologie.placesAutorisees)
              : 0,
          })) || [],
      };
    });
};

export const transformApiAdressesToFormAdresses = (
  adresses: AdresseApiType[] = []
): FormAdresse[] => {
  // We add adresseComplete (who is not saved in db) to the adresses
  // We also convert logementSocial and qpv to boolean
  // And also convert repartition db value to form value (from uppercase to enum value)
  let formAdresses: FormAdresse[] = [];
  if (adresses.length > 0) {
    formAdresses = adresses.map((adresse) => ({
      ...adresse,
      adresse: adresse.adresse ?? "",
      codePostal: adresse.codePostal ?? "",
      commune: adresse.commune ?? "",
      repartition:
        Repartition[
          adresse.repartition?.trim().toUpperCase() as keyof typeof Repartition
        ],
      adresseComplete: [adresse.adresse, adresse.codePostal, adresse.commune]
        .filter(Boolean)
        .join(" ")
        .trim(),
      adresseTypologies: adresse.adresseTypologies?.map((adresseTypologie) => ({
        ...adresseTypologie,
        logementSocial: adresseTypologie.logementSocial ? true : false,
        qpv: adresseTypologie.qpv ? true : false,
      })),
    }));
  }
  return formAdresses;
};

/**
 * Formate un nom de ville selon les règles de typographie françaises :
 * https://www.amf.asso.fr/documents-noms-communes-nouvelles-les-regles-respecter/24266
 */
export const formatCityName = (city: string): string | null => {
  if (typeof city !== "string") {
    return city;
  }
  const normalized = city.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  const articles = new Set(["le", "la", "les", "l"]);
  const prepositions = new Set([
    "sur",
    "en",
    "de",
    "du",
    "des",
    "à",
    "au",
    "aux",
    "sous",
    "dans",
    "par",
    "pour",
    "avec",
    "sans",
    "vers",
    "d",
    "l",
  ]);

  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0) {
    return null;
  }

  const firstWordLower = words[0].toLowerCase();
  const hasArticleAtStart = articles.has(firstWordLower);

  const formatPart = (
    part: string,
    partIndex: number,
    wordIndex: number,
    hasApostrophe: boolean
  ): string => {
    const isPartArticle = partIndex > 0 && articles.has(part);
    const isPartPreposition = partIndex > 0 && prepositions.has(part);

    if (isPartArticle || isPartPreposition) {
      return part;
    }

    if (hasApostrophe && wordIndex > 0 && (part === "l" || part === "d")) {
      return part;
    }

    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  const formatWord = (word: string, wordIndex: number): string => {
    const wordLower = word.toLowerCase();
    const isArticleInside = wordIndex > 0 && articles.has(wordLower);
    const isPreposition = prepositions.has(wordLower);

    if (isArticleInside || isPreposition) {
      return wordLower;
    }

    const hasApostrophe = wordLower.includes("'");
    const hasHyphen = wordLower.includes("-");

    if (hasApostrophe || hasHyphen) {
      const separator = hasApostrophe ? "'" : "-";
      const parts = wordLower.split(separator);
      const formattedParts = parts.map((part, partIndex) =>
        formatPart(part, partIndex, wordIndex, hasApostrophe)
      );
      return formattedParts.join(separator);
    }

    return formatPart(wordLower, 0, wordIndex, false);
  };

  const formattedWords = words.map(formatWord);

  let result = formattedWords[0];
  for (let i = 1; i < formattedWords.length; i++) {
    const separator = hasArticleAtStart && i === 1 ? " " : "-";
    result += separator + formattedWords[i];
  }

  return result;
};

type Coordinates = {
  latitude: number | undefined;
  longitude: number | undefined;
};
