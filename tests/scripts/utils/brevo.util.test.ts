import { toBrevoContact } from "scripts/utils/brevo.util";

import { GrantDb } from "@/app/api/users/user.db.type";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

const buildGrant = (overrides: Partial<GrantDb> = {}): GrantDb => ({
  role: AccessRole.EDITEUR,
  scope: GrantScope.NATIONAL,
  region: null,
  departement: null,
  structure: null,
  operateurId: null,
  ...overrides,
});

const departementGrant = (numero: string, name: string, role?: AccessRole) =>
  buildGrant({
    ...(role ? { role } : {}),
    scope: GrantScope.DEPARTEMENT,
    departement: { numero, name },
  });

const nationalViewerGrant = buildGrant({ role: AccessRole.VIEWER });

const baseUser = {
  email: "agent@dreets.gouv.fr",
  lastConnection: new Date("2026-09-15T08:30:00.000Z"),
  createdAt: new Date("2025-01-20T10:00:00.000Z"),
  grants: [],
  emailPattern: null,
};

describe("brevo util", () => {
  it("mappe un agent départemental sur les attributs Brevo", () => {
    // GIVEN
    const user = {
      ...baseUser,
      grants: [departementGrant("13", "Bouches-du-Rhône")],
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact).toEqual({
      email: "agent@dreets.gouv.fr",
      attributes: {
        DEPARTEMENT: "13",
        STATUT: "Agent",
        PERIMETRE: "Bouches-du-Rhône",
        LAST_LOGIN: "2026-09-15",
        CREATION_COMPTE: "2025-01-20",
      },
    });
  });

  it("récupère les droits de base du pattern d'email et ignore le binôme viewer national", () => {
    // GIVEN
    const user = {
      ...baseUser,
      emailPattern: {
        grants: [
          nationalViewerGrant,
          buildGrant({
            scope: GrantScope.REGION,
            region: {
              name: "Bretagne",
              departements: [
                { numero: "35" },
                { numero: "22" },
                { numero: "56" },
                { numero: "29" },
              ],
            },
          }),
        ],
      },
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("Bretagne");
    expect(contact.attributes.DEPARTEMENT).toBe("22, 29, 35, 56");
  });

  it("cumule les binômes du pattern et ceux de l'utilisateur", () => {
    // GIVEN
    const user = {
      ...baseUser,
      grants: [departementGrant("29", "Finistère", AccessRole.ADMIN)],
      emailPattern: {
        grants: [departementGrant("75", "Paris")],
      },
    };

    // WHEN
    const contact = toBrevoContact(user);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("Paris, Finistère");
    expect(contact.attributes.DEPARTEMENT).toBe("29, 75");
  });

  it("laisse le périmètre vide quand aucun binôme n'est rattaché", () => {
    // WHEN
    const contact = toBrevoContact(baseUser);

    // THEN
    expect(contact.attributes.PERIMETRE).toBe("");
    expect(contact.attributes.DEPARTEMENT).toBe("");
  });
});
