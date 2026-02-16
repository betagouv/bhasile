import { ControleType } from "@/generated/prisma/client";

export const convertToControleType = (
  controleType: string | undefined
): ControleType => {
  if (!controleType) {return ControleType.INOPINE;}
  const typesControles: Record<string, ControleType> = {
    Inopiné: ControleType.INOPINE,
    Programmé: ControleType.PROGRAMME,
  };
  return typesControles[controleType.trim()];
};
