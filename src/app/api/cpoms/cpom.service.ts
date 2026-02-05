import prisma from "@/lib/prisma";
import { ActeAdministratifCategory } from "@/types/file-upload.type";

export type StructureLastCpomResult = {
  cpomId: number;
  dateStart: Date;
  dateEnd: Date;
};

// Returns the last CPOM for a structure with its start and end dates, taking into account:
//  - Potential "avenants"
//  - Potential early join or late leave
export const structureLastCpom = async (
  structureId: number
): Promise<StructureLastCpomResult | null> => {
  const cpomStructures = await prisma.cpomStructure.findMany({
    where: {
      structureId,
    },
    include: {
      cpom: {
        include: {
          actesAdministratifs: true,
        },
      },
    },
  });

  if (cpomStructures.length === 0) {
    return null;
  }

  const adminCategories = ActeAdministratifCategory as readonly string[];

  const possibleCpoms: StructureLastCpomResult[] = [];

  for (const cs of cpomStructures) {
    const { cpom } = cs;

    const actes = cpom.actesAdministratifs.filter((fileUpload) =>
      adminCategories.includes(fileUpload.category as string)
    );

    const startCandidates: Date[] = [];
    if (cpom.dateStart) {
      startCandidates.push(cpom.dateStart);
    }
    for (const acte of actes) {
      if (acte.startDate) {
        startCandidates.push(acte.startDate);
      }
    }

    const endCandidates: Date[] = [];
    if (cpom.dateEnd) {
      endCandidates.push(cpom.dateEnd);
    }
    for (const acte of actes) {
      if (acte.endDate) {
        endCandidates.push(acte.endDate);
      }
    }

    const cpomEffectiveStart = new Date(
      Math.min(...startCandidates.map((d) => d.getTime()))
    );
    const cpomEffectiveEnd = new Date(
      Math.max(...endCandidates.map((d) => d.getTime()))
    );

    // A structure can join early or leave late
    const effectiveStart = cs.dateStart ?? cpomEffectiveStart;
    const effectiveEnd = cs.dateEnd ?? cpomEffectiveEnd;

    possibleCpoms.push({
      cpomId: cpom.id,
      dateStart: effectiveStart,
      dateEnd: effectiveEnd,
    });
  }

  if (possibleCpoms.length === 0) {
    return null;
  }

  // Keeping only last CPOM
  possibleCpoms.sort((a, b) => {
    return b.dateStart.getTime() - a.dateStart.getTime();
  });
  return possibleCpoms[0];
};
