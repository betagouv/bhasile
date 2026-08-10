import { describe, expect, it } from "vitest";

import {
  AnomalieCategory as PrismaAnomalieCategory,
  AnomalieCode as PrismaAnomalieCode,
} from "@/generated/prisma/enums";
import {
  ANOMALIE_DEFINITIONS,
  DISPLAYED_ANOMALIE_CODES,
} from "@/lib/anomalies/anomalie.definition";
import { AnomalieCategory, AnomalieCode } from "@/types/anomalie.type";

describe("registre des anomalies", () => {
  it("expose exactement les mêmes codes que l'enum Prisma", () => {
    expect([...AnomalieCode].sort()).toEqual(
      Object.values(PrismaAnomalieCode).sort()
    );
  });

  it("expose exactement les mêmes catégories que l'enum Prisma", () => {
    expect([...AnomalieCategory].sort()).toEqual(
      Object.values(PrismaAnomalieCategory).sort()
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

  it("associe une section de modification à chaque code affiché", () => {
    const codesSansDestination = DISPLAYED_ANOMALIE_CODES.filter(
      (code) => !ANOMALIE_DEFINITIONS[code].modificationSection
    );

    expect(codesSansDestination).toEqual([]);
  });
});
