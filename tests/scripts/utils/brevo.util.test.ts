import { toBrevoContact } from "scripts/utils/brevo.util";
import {
  createDepartementPerimeter,
  createNationalPerimeter,
  createRegionPerimeter,
} from "tests/test-utils/factories/user-with-grants.factory";

const baseUser = {
  email: "agent@dreets.gouv.fr",
  lastConnection: new Date("2026-09-15T08:30:00.000Z"),
  createdAt: new Date("2025-01-20T10:00:00.000Z"),
  isActivated: true,
  deactivatedAt: null,
  perimeter: createDepartementPerimeter("13", "Bouches-du-Rhône"),
};

describe("brevo util", () => {
  it("mappe un agent départemental sur les attributs Brevo", () => {
    // WHEN
    const contact = toBrevoContact(baseUser);

    // THEN
    expect(contact).toEqual({
      email: "agent@dreets.gouv.fr",
      attributes: {
        DEPARTEMENT: "13",
        STATUT: "Agent",
        PERIMETRE: "Bouches-du-Rhône",
        LAST_LOGIN: "2026-09-15",
        CREATION_COMPTE: "2025-01-20",
        ACTIVE_USER: true,
      },
    });
  });

  it("donne la région et ses départements pour un agent régional, sans la lecture nationale", () => {
    // WHEN
    const contact = toBrevoContact({
      ...baseUser,
      perimeter: createRegionPerimeter(),
    });

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("Bretagne");
    expect(contact.attributes.DEPARTEMENT).toBe("22, 29, 35");
  });

  it("marque un agent national sans département", () => {
    // WHEN
    const contact = toBrevoContact({
      ...baseUser,
      perimeter: createNationalPerimeter(),
    });

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("National");
    expect(contact.attributes.DEPARTEMENT).toBe("");
  });

  it("laisse la date de dernière connexion vide pour un utilisateur jamais connecté", () => {
    // WHEN
    const contact = toBrevoContact({ ...baseUser, lastConnection: null });

    // THEN
    expect(contact.attributes.LAST_LOGIN).toBe("");
  });

  it("laisse le périmètre vide pour un compte non activé", () => {
    // WHEN
    const contact = toBrevoContact({ ...baseUser, isActivated: false });

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("");
    expect(contact.attributes.DEPARTEMENT).toBe("");
  });

  it("marque inactif un agent désactivé, sans changer son statut", () => {
    // WHEN
    const contact = toBrevoContact({
      ...baseUser,
      isActivated: false,
      deactivatedAt: new Date("2026-11-04T10:00:00.000Z"),
    });

    // THEN
    expect(contact.attributes.ACTIVE_USER).toBe(false);
    expect(contact.attributes.STATUT).toBe("Agent");
  });
});
