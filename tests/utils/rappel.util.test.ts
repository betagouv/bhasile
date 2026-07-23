import { describe, expect, it } from "vitest";

import { groupRappels } from "@/app/utils/rappel.util";
import { DashboardRappel } from "@/types/dashboard.type";
import { StructureType } from "@/types/structure.type";

const makeRappel = (
  overrides: Partial<DashboardRappel> = {}
): DashboardRappel => ({
  id: "r1",
  echelle: "STRUCTURE",
  taskType: "RENOUVELLEMENT_AUTORISATION",
  taskLabel: "Renouvellement autorisation",
  deadline: "2026-08-10",
  criticite: "IMPORTANT",
  actionUrl: "/structures/1",
  structureId: 1,
  structureCodeBhasile: "BHA-001",
  structureType: StructureType.CADA,
  structureCommune: "Avranches",
  structureDepartement: "50",
  operateurName: "Adoma",
  cpomId: 10,
  cpomLabel: "COALLIA",
  cpomDepartements: ["92", "93"],
  ...overrides,
});

describe("groupRappels", () => {
  it("ne garde que les rappels de l'échelle demandée", () => {
    const rappels = [
      makeRappel({ id: "s1", echelle: "STRUCTURE" }),
      makeRappel({ id: "c1", echelle: "CPOM", cpomId: 10 }),
    ];

    const structureNodes = groupRappels(rappels, "STRUCTURE", "CRITICITE");
    expect(
      structureNodes.flatMap((node) => ("rappels" in node ? node.rappels : []))
    ).toHaveLength(1);
    expect(
      structureNodes.flatMap((node) =>
        "rappels" in node ? node.rappels.map((rappel) => rappel.id) : []
      )
    ).toEqual(["s1"]);
  });

  it("groupe par structure avec compteurs", () => {
    const rappels = [
      makeRappel({ id: "a", structureId: 1, criticite: "URGENT" }),
      makeRappel({ id: "b", structureId: 1, criticite: "IMPORTANT" }),
      makeRappel({ id: "c", structureId: 2, criticite: "URGENT" }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "STRUCTURE");

    expect(nodes).toHaveLength(2);
    const structure1 = nodes.find((node) => node.key === "structure-1")!;
    expect(structure1.urgentCount).toBe(1);
    expect(structure1.importantCount).toBe(1);
    expect(structure1.header).toMatchObject({
      kind: "STRUCTURE",
      structureCodeBhasile: "BHA-001",
      structureType: StructureType.CADA,
    });
  });

  it("imbrique CPOM → structure → rappels à l'échelle structure groupée par CPOM", () => {
    const rappels = [
      makeRappel({ id: "a", cpomId: 10, structureId: 1, criticite: "URGENT" }),
      makeRappel({
        id: "b",
        cpomId: 10,
        structureId: 2,
        criticite: "IMPORTANT",
      }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "CPOM");

    expect(nodes).toHaveLength(1);
    const cpomNode = nodes[0];
    expect(cpomNode.key).toBe("cpom-10");
    expect(cpomNode.header).toMatchObject({
      kind: "CPOM",
      cpomLabel: "COALLIA",
      cpomDepartements: ["92", "93"],
    });
    expect(cpomNode.urgentCount).toBe(1);
    expect(cpomNode.importantCount).toBe(1);

    if (!("children" in cpomNode)) {
      throw new Error("le nœud CPOM doit avoir des enfants structure");
    }
    expect(cpomNode.children).toHaveLength(2);
    const structureChild = cpomNode.children.find(
      (child) => child.key === "structure-1"
    )!;
    expect("rappels" in structureChild).toBe(true);
  });

  it("exclut les structures sans CPOM du groupage par CPOM", () => {
    const rappels = [
      makeRappel({ id: "a", cpomId: 10, structureId: 1 }),
      makeRappel({ id: "b", cpomId: null, structureId: 2 }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "CPOM");

    expect(nodes).toHaveLength(1);
    expect(nodes[0].key).toBe("cpom-10");
  });

  it("groupe par tâche avec le label canonique", () => {
    const rappels = [
      makeRappel({ id: "a", taskType: "EVALUATION", taskLabel: "Évaluation à mener" }),
      makeRappel({ id: "b", taskType: "EVALUATION", taskLabel: "Évaluation à lancer" }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "TASK");

    expect(nodes).toHaveLength(1);
    expect(nodes[0].header).toMatchObject({
      kind: "TASK",
      taskType: "EVALUATION",
      taskLabel: "Évaluation",
    });
  });

  it("groupe par criticité", () => {
    const rappels = [
      makeRappel({ id: "a", criticite: "URGENT" }),
      makeRappel({ id: "b", criticite: "IMPORTANT" }),
      makeRappel({ id: "c", criticite: "URGENT" }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "CRITICITE");

    expect(nodes.map((node) => node.key)).toEqual([
      "criticite-URGENT",
      "criticite-IMPORTANT",
    ]);
    expect(nodes[0].urgentCount).toBe(2);
  });

  it("trie les groupes par urgence décroissante", () => {
    const rappels = [
      makeRappel({ id: "a", structureId: 1, criticite: "IMPORTANT" }),
      makeRappel({ id: "b", structureId: 2, criticite: "URGENT" }),
      makeRappel({ id: "c", structureId: 2, criticite: "URGENT" }),
    ];

    const nodes = groupRappels(rappels, "STRUCTURE", "STRUCTURE");

    expect(nodes.map((node) => node.key)).toEqual([
      "structure-2",
      "structure-1",
    ]);
  });

  it("groupe les rappels d'échelle CPOM par CPOM sans imbrication", () => {
    const rappels = [
      makeRappel({
        id: "a",
        echelle: "CPOM",
        taskType: "RENOUVELLEMENT_CPOM",
        structureId: null,
        cpomId: 10,
      }),
    ];

    const nodes = groupRappels(rappels, "CPOM", "CPOM");

    expect(nodes).toHaveLength(1);
    expect("rappels" in nodes[0]).toBe(true);
    expect(nodes[0].key).toBe("cpom-10");
  });

  it("trie les rappels d'une feuille urgent avant important", () => {
    const rappels = [
      makeRappel({
        id: "important",
        structureId: 1,
        criticite: "IMPORTANT",
        deadline: "2026-01-01",
      }),
      makeRappel({
        id: "urgent",
        structureId: 1,
        criticite: "URGENT",
        deadline: "2026-12-01",
      }),
    ];

    const [node] = groupRappels(rappels, "STRUCTURE", "STRUCTURE");
    if (!("rappels" in node)) {
      throw new Error("nœud feuille attendu");
    }
    expect(node.rappels.map((rappel) => rappel.id)).toEqual([
      "urgent",
      "important",
    ]);
  });
});
