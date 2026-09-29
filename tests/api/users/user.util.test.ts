import { describe, expect, it } from "vitest";

import { GrantWithPerimetre } from "@/app/api/users/user.db.type";
import { getEffectiveGrants, toSessionGrant } from "@/app/api/users/user.util";
import { AccessRole } from "@/generated/prisma/client";

const buildGrant = (
  role: AccessRole,
  perimetre: Partial<GrantWithPerimetre["perimetre"]> = {}
): GrantWithPerimetre => ({
  role,
  perimetre: {
    name: "Périmètre",
    isNational: false,
    operateurId: null,
    regions: [],
    departements: [],
    structures: [],
    ...perimetre,
  },
});

describe("toSessionGrant", () => {
  it("résout les régions en départements sans doublon avec les départements cochés", () => {
    const grant = buildGrant(AccessRole.EDITEUR, {
      regions: [
        { region: { departements: [{ numero: "29" }, { numero: "35" }] } },
      ],
      departements: [{ departementNumero: "29" }, { departementNumero: "44" }],
    });

    expect(toSessionGrant(grant).departementNumeros).toEqual([
      "29",
      "35",
      "44",
    ]);
  });

  it("conserve l'opérateur, les structures et le caractère national du périmètre", () => {
    const grant = buildGrant(AccessRole.ADMIN, {
      isNational: true,
      operateurId: 12,
      structures: [{ structureId: 3 }],
    });

    expect(toSessionGrant(grant)).toEqual({
      role: AccessRole.ADMIN,
      isNational: true,
      departementNumeros: [],
      structureIds: [3],
      operateurId: 12,
    });
  });
});

describe("getEffectiveGrants", () => {
  it("cumule les droits de base du pattern d'email et les binômes de l'utilisateur", () => {
    const patternGrant = buildGrant(AccessRole.VIEWER, { isNational: true });
    const userGrant = buildGrant(AccessRole.EDITEUR);

    expect(
      getEffectiveGrants({
        grants: [userGrant],
        emailPattern: { grants: [patternGrant] },
      })
    ).toEqual([patternGrant, userGrant]);
  });

  it("ne renvoie que les binômes de l'utilisateur quand aucun pattern ne correspond", () => {
    const userGrant = buildGrant(AccessRole.EDITEUR);

    expect(
      getEffectiveGrants({ grants: [userGrant], emailPattern: null })
    ).toEqual([userGrant]);
  });
});
