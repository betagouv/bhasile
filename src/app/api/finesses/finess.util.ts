import { StructureDbDetails } from "../structures/structure.db.type";

export const getFinessesApiRead = (
  finesses?: StructureDbDetails["finesses"]
) =>
  finesses?.map((finess) => ({
    ...finess,
    code: finess.code,
    description: finess.description ?? undefined,
  }));
