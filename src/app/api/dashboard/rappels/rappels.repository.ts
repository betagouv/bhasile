import prisma from "@/lib/prisma";

import { rappelStructureSelect } from "./rappels.db.type";

export const findRappelStructures = () =>
  prisma.structure.findMany({ select: rappelStructureSelect });
