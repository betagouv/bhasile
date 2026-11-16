import { createDepartementalAgent } from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateTransformation } from "@/app/api/transformations/transformation.service";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

const mockUpdateOne = vi.fn();

vi.mock("@/lib/prisma", () => ({ default: {} }));

vi.mock("@/app/api/transformations/transformation.repository", () => ({
  createOne: vi.fn(),
  deleteOne: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  resetSelection: vi.fn(),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/adresses/ban.service", () => ({
  locateStructureVersions: async (values: unknown) => values,
}));

const agent75 = createDepartementalAgent(["75"]);

const creationHorsPerimetre: TransformationApiRead = {
  id: 1,
  structureVersionTransformations: [
    {
      id: 2,
      type: StructureVersionTransformationType.CREATION,
      structureVersion: { departementAdministratif: "40" },
    },
  ],
};

describe("updateTransformation", () => {
  beforeEach(() => {
    mockUpdateOne.mockResolvedValue(1);
  });

  it("enregistre un brouillon dont l'adresse est hors du périmètre de l'agent", async () => {
    await updateTransformation(
      {
        id: 1,
        structureVersionTransformations: [
          {
            id: 2,
            type: StructureVersionTransformationType.CREATION,
            structureVersion: { departementAdministratif: "40" },
          },
        ],
      },
      creationHorsPerimetre,
      agent75
    );

    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it("refuse de finaliser une transformation dont une adresse est hors du périmètre de l'agent", async () => {
    await expect(
      updateTransformation(
        {
          id: 1,
          form: {
            id: 3,
            status: true,
            formDefinition: { id: 4, slug: "s", name: "n", version: 1 },
            formSteps: [],
          },
        },
        creationHorsPerimetre,
        agent75
      )
    ).rejects.toThrow("Le département 40 n'est pas dans votre périmètre.");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
