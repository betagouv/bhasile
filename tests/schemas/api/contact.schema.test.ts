import { describe, expect, it } from "vitest";

import { contactApiSchema } from "@/schemas/api/contact.schema";

const contact = {
  structureId: 1,
  prenom: "Jean",
  nom: "Dupont",
  telephone: "0102030405",
  role: "Directeur",
};

describe("contactApiSchema", () => {
  it("enregistre l'email du contact sans espaces et en minuscules", () => {
    const result = contactApiSchema.parse({
      ...contact,
      email: " Jean.Dupont@Coallia.org ",
    });

    expect(result.email).toBe("jean.dupont@coallia.org");
  });

  it("rejette un email invalide", () => {
    const result = contactApiSchema.safeParse({
      ...contact,
      email: "jean.dupont",
    });

    expect(result.success).toBe(false);
  });
});
