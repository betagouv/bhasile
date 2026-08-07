import prisma from "@/lib/prisma";

import { anomalieStructureSelect } from "./anomalies.db.type";

export const findAnomalieStructures = () =>
  prisma.structure.findMany({ select: anomalieStructureSelect });
