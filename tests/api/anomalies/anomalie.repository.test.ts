import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  findAnomaliesByStructureId,
  reconcileAnomalies,
} from "@/app/api/anomalies/anomalie.repository";
import prisma from "@/lib/prisma";

describe("anomalie.repository reconcileAnomalies db integration", () => {
  const createdStructureIds: number[] = [];
  let structureId: number;

  const detectee = (
    code: "RESULTAT_NET_EQ_0" | "MULTI_DNA",
    year = 0,
    targetId = 0
  ) => ({
    code,
    year,
    targetId,
  });

  beforeEach(async () => {
    const structure = await prisma.structure.create({
      data: { codeBhasile: `BHA-ANO-TEST-${randomUUID()}` },
    });
    createdStructureIds.push(structure.id);
    structureId = structure.id;
  });

  afterAll(async () => {
    await prisma.anomalie.deleteMany({
      where: { structureId: { in: createdStructureIds } },
    });
    await prisma.structure.deleteMany({
      where: { id: { in: createdStructureIds } },
    });
    await prisma.$disconnect();
  });

  it("crée les anomalies détectées", async () => {
    await reconcileAnomalies(
      structureId,
      [detectee("RESULTAT_NET_EQ_0", 2024)],
      ["RESULTAT_NET_EQ_0"]
    );

    const anomalies = await findAnomaliesByStructureId(structureId);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toMatchObject({
      code: "RESULTAT_NET_EQ_0",
      year: 2024,
    });
  });

  it("conserve le commentaire et la justification d'une anomalie toujours détectée", async () => {
    await reconcileAnomalies(
      structureId,
      [detectee("RESULTAT_NET_EQ_0", 2024)],
      ["RESULTAT_NET_EQ_0"]
    );
    await prisma.anomalie.updateMany({
      where: { structureId },
      data: { isJustified: true, commentaire: "dérogation" },
    });

    await reconcileAnomalies(
      structureId,
      [detectee("RESULTAT_NET_EQ_0", 2024)],
      ["RESULTAT_NET_EQ_0"]
    );

    const anomalies = await findAnomaliesByStructureId(structureId);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toMatchObject({
      isJustified: true,
      commentaire: "dérogation",
    });
  });

  it("supprime une anomalie évaluée qui n'est plus détectée", async () => {
    await reconcileAnomalies(
      structureId,
      [detectee("RESULTAT_NET_EQ_0", 2024)],
      ["RESULTAT_NET_EQ_0"]
    );

    await reconcileAnomalies(structureId, [], ["RESULTAT_NET_EQ_0"]);

    expect(await findAnomaliesByStructureId(structureId)).toHaveLength(0);
  });

  it("préserve une anomalie dont la règle n'a pas été évaluée", async () => {
    await reconcileAnomalies(
      structureId,
      [detectee("MULTI_DNA")],
      ["MULTI_DNA"]
    );

    await reconcileAnomalies(structureId, [], ["RESULTAT_NET_EQ_0"]);

    const anomalies = await findAnomaliesByStructureId(structureId);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toMatchObject({ code: "MULTI_DNA" });
  });

  it("distingue deux exercices de la même règle", async () => {
    await reconcileAnomalies(
      structureId,
      [
        detectee("RESULTAT_NET_EQ_0", 2023),
        detectee("RESULTAT_NET_EQ_0", 2024),
      ],
      ["RESULTAT_NET_EQ_0"]
    );

    await reconcileAnomalies(
      structureId,
      [detectee("RESULTAT_NET_EQ_0", 2024)],
      ["RESULTAT_NET_EQ_0"]
    );

    const anomalies = await findAnomaliesByStructureId(structureId);

    expect(anomalies.map(({ year }) => year)).toEqual([2024]);
  });
});
