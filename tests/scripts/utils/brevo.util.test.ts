import { toBrevoContact } from "scripts/utils/brevo.util";

describe("brevo util", () => {
  it("mappe un agent départemental sur les attributs Brevo", () => {
    // GIVEN
    const user = {
      email: "agent@dreets.gouv.fr",
      lastConnection: new Date("2026-09-15T08:30:00.000Z"),
      createdAt: new Date("2025-01-20T10:00:00.000Z"),
      role: {
        name: "DEPARTEMENT_BOUCHES_DU_RHONE",
        roleDepartements: [{ departementNumero: "13" }],
      },
      emailPattern: null,
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact).toEqual({
      email: "agent@dreets.gouv.fr",
      attributes: {
        DEPARTEMENT: "13",
        STATUT: "Agent",
        PERIMETRE: "DEPARTEMENT_BOUCHES_DU_RHONE",
        LAST_LOGIN: "2026-09-15",
        CREATION_COMPTE: "2025-01-20",
      },
    });
  });

  it("récupère le rôle du pattern d'email quand l'utilisateur n'en porte pas", () => {
    // GIVEN
    const user = {
      email: "agent@bretagne.gouv.fr",
      lastConnection: new Date("2026-09-15T08:30:00.000Z"),
      createdAt: new Date("2025-01-20T10:00:00.000Z"),
      role: null,
      emailPattern: {
        role: {
          name: "REGION_BRETAGNE",
          roleDepartements: [
            { departementNumero: "35" },
            { departementNumero: "22" },
            { departementNumero: "56" },
            { departementNumero: "29" },
          ],
        },
      },
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("REGION_BRETAGNE");
    expect(contact.attributes.DEPARTEMENT).toBe("22, 29, 35, 56");
  });

  it("liste tous les départements d'un rôle national", () => {
    // GIVEN
    const user = {
      email: "agent@national.gouv.fr",
      lastConnection: new Date("2026-09-15T08:30:00.000Z"),
      createdAt: new Date("2025-01-20T10:00:00.000Z"),
      role: null,
      emailPattern: {
        role: {
          name: "NATIONAL",
          roleDepartements: [
            { departementNumero: "75" },
            { departementNumero: "01" },
            { departementNumero: "13" },
          ],
        },
      },
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("NATIONAL");
    expect(contact.attributes.DEPARTEMENT).toBe("01, 13, 75");
  });

  it("laisse le périmètre vide quand aucun rôle n'est rattaché", () => {
    // GIVEN
    const user = {
      email: "agent@sans-role.gouv.fr",
      lastConnection: new Date("2026-09-15T08:30:00.000Z"),
      createdAt: new Date("2025-01-20T10:00:00.000Z"),
      role: null,
      emailPattern: null,
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("");
    expect(contact.attributes.DEPARTEMENT).toBe("");
  });
});
