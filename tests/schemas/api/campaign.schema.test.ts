import { describe, expect, it } from "vitest";

import { campaignApiWriteSchema } from "@/schemas/api/campaign.schema";
import { StepStatus } from "@/types/form.type";

describe("campaignApiWriteSchema", () => {
  it("accepte un payload minimal (structureId + year)", () => {
    const result = campaignApiWriteSchema.safeParse({
      structureId: 1,
      year: 2026,
    });

    expect(result.success).toBe(true);
  });

  it("rejette un payload sans structureId", () => {
    const result = campaignApiWriteSchema.safeParse({ year: 2026 });

    expect(result.success).toBe(false);
  });

  it("accepte une étape avec un statut valide", () => {
    const result = campaignApiWriteSchema.safeParse({
      structureId: 1,
      year: 2026,
      step: { slug: "01-places", status: StepStatus.VALIDE },
    });

    expect(result.success).toBe(true);
  });

  it("rejette une étape avec un statut inconnu", () => {
    const result = campaignApiWriteSchema.safeParse({
      structureId: 1,
      year: 2026,
      step: { slug: "01-places", status: "PAS_UN_STATUT" },
    });

    expect(result.success).toBe(false);
  });

  it("accepte le flag validate", () => {
    const result = campaignApiWriteSchema.safeParse({
      structureId: 1,
      year: 2026,
      validate: true,
    });

    expect(result.success).toBe(true);
  });
});
