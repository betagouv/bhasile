import { REGIONS } from "@/constants";
import prisma from "@/lib/prisma";

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
  regionName?: string
): Promise<string> => {
  const regionCode = REGIONS.find((region) => region.name === regionName)?.code;
  if (!regionCode) {
    throw new Error(`Region ${regionName} not found`);
  }
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
