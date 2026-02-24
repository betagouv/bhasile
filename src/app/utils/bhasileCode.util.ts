import prisma from "@/lib/prisma";

export const REGION_CODES = {
  "Auvergne-Rhône-Alpes": "ARA",
  "Bourgogne-Franche-Comté": "BFC",
  "Bretagne": "BRE",
  "Centre-Val de Loire": "CVL",
  "Corse": "20R",
  "Grand Est": "GES",
  "Guadeloupe": "971",
  "Guyane": "973",
  "Hauts-de-France": "HDF",
  "Île-de-France": "IDF",
  "La Réunion": "974",
  "Martinique": "972",
  "Mayotte": "976",
  "Normandie": "NOR",
  "Nouvelle-Aquitaine": "NAQ",
  "Occitanie": "OCC",
  "Pays de la Loire": "PDL",
  "Provence-Alpes-Côte d'Azur": "PAC",
} as const;

// Region codes are based on https://fr.wikipedia.org/wiki/ISO_3166-2:FR

const PREFIX = "BHA";

const extractCounterFromCode = (codeBhasile: string): number | null => {
  const match = codeBhasile.match(/^BHA-[A-Z0-9]{3}-(\d{3})$/);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10);
};

const getLastBhasileCodeForRegion = async (
  regionCode: string
): Promise<string | null> => {
  const prefix = `${PREFIX}-${regionCode}-`;

  const lastStructure = await prisma.structure.findFirst({
    where: {
      codeBhasile: {
        startsWith: prefix,
      },
    },
    orderBy: {
      codeBhasile: "desc",
    },
    select: {
      codeBhasile: true,
    },
  });

  return lastStructure?.codeBhasile ?? null;
};


export const generateBhasileCode = async (
  region: keyof typeof REGION_CODES
): Promise<string> => {

  const regionCode = REGION_CODES[region];
  const lastCode = await getLastBhasileCodeForRegion(regionCode);

  let nextCounter = 1;
  if (lastCode) {
    const lastCounter = extractCounterFromCode(lastCode);
    if (lastCounter !== null) {
      nextCounter = lastCounter + 1;
    }
  }

  const formattedCounter = String(nextCounter).padStart(3, "0");
  return `${PREFIX}-${regionCode}-${formattedCounter}`;
};
