import { describe, expect, it } from "vitest";

import {
  AnomalieCategorie as PrismaAnomalieCategorie,
  AnomalieCode as PrismaAnomalieCode,
} from "@/generated/prisma/enums";
import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import { AnomalieCategorie, AnomalieCode } from "@/types/anomalie.type";

describe("registre des anomalies", () => {
  it("expose exactement les mêmes codes que l'enum Prisma", () => {
    expect([...AnomalieCode].sort()).toEqual(
      Object.values(PrismaAnomalieCode).sort()
    );
  });

  it("expose exactement les mêmes catégories que l'enum Prisma", () => {
    expect([...AnomalieCategorie].sort()).toEqual(
      Object.values(PrismaAnomalieCategorie).sort()
    );
  });

  it("ne déclare aucun code en double", () => {
    expect(new Set(AnomalieCode).size).toBe(AnomalieCode.length);
  });

  it("définit chaque code du registre", () => {
    expect(Object.keys(ANOMALIE_DEFINITIONS).sort()).toEqual(
      [...AnomalieCode].sort()
    );
  });
});
