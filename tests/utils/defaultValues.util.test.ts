import { describe, expect, it } from "vitest";

import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import { StructureType } from "@/types/structure.type";

import { createStructure } from "../test-utils/structure.factory";

describe("getActualisationDefaultValues", () => {
  it("conserve la convention persistée dans les actes par défaut", () => {
    const structure = {
      ...createStructure({ id: 1, type: StructureType.HUDA }),
      actesAdministratifs: [
        {
          id: 10,
          category: "CONVENTION" as const,
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2027-01-01T00:00:00.000Z",
          fileUploads: [{ id: 5, key: "convention-2026" }],
        },
      ],
    };

    const defaultValues = getActualisationDefaultValues({
      structure,
      year: 2026,
    });
    const convention = defaultValues.actesAdministratifs?.find(
      (acteAdministratif) => acteAdministratif.category === "CONVENTION"
    );

    expect(convention?.fileUploads?.[0]?.key).toBe("convention-2026");
  });

  it("conserve la convention persistée d'une structure autorisée", () => {
    const structure = {
      ...createStructure({ id: 3, type: StructureType.CADA }),
      actesAdministratifs: [
        {
          id: 30,
          category: "CONVENTION" as const,
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2027-01-01T00:00:00.000Z",
          fileUploads: [{ id: 7, key: "convention-autorisee" }],
        },
      ],
    };

    const defaultValues = getActualisationDefaultValues({
      structure,
      year: 2026,
    });
    const convention = defaultValues.actesAdministratifs?.find(
      (acteAdministratif) => acteAdministratif.category === "CONVENTION"
    );

    expect(convention?.fileUploads?.[0]?.key).toBe("convention-autorisee");
  });

  it("exclut les actes hors des catégories affichées à l'actualisation", () => {
    const structure = {
      ...createStructure({ id: 2, type: StructureType.HUDA }),
      actesAdministratifs: [
        {
          id: 20,
          category: "ARRETE_AUTORISATION" as const,
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2027-01-01T00:00:00.000Z",
          fileUploads: [{ id: 6, key: "arrete-autorisation" }],
        },
      ],
    };

    const defaultValues = getActualisationDefaultValues({
      structure,
      year: 2026,
    });

    expect(
      defaultValues.actesAdministratifs?.some(
        (acteAdministratif) =>
          acteAdministratif.category === "ARRETE_AUTORISATION"
      )
    ).toBe(false);
  });
});
