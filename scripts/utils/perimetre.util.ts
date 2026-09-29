import { AccessRole, type PrismaClient } from "@/generated/prisma/client";

export const NATIONAL_PERIMETRE_NAME = "National";

export const findOrCreatePerimetre = async (
  prisma: PrismaClient,
  zone: AgentZone
): Promise<number> => {
  if (zone.kind === "national") {
    const existing = await prisma.perimetre.findFirst({
      where: { isNational: true, operateurId: null },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await prisma.perimetre.create({
      data: { name: NATIONAL_PERIMETRE_NAME, isNational: true },
      select: { id: true },
    });
    return created.id;
  }

  const existing = await prisma.perimetre.findFirst({
    where: { name: zone.name, isNational: false, operateurId: null },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.perimetre.create({
    data: {
      name: zone.name,
      ...(zone.kind === "region"
        ? { regions: { create: { regionId: zone.regionId } } }
        : {
            departements: {
              createMany: {
                data: zone.departementNumeros.map((departementNumero) => ({
                  departementNumero,
                })),
              },
            },
          }),
    },
    select: { id: true },
  });
  return created.id;
};

export const getAgentBaseGrants = async (
  prisma: PrismaClient,
  zone: AgentZone
): Promise<{ role: AccessRole; perimetreId: number }[]> => {
  const nationalPerimetreId = await findOrCreatePerimetre(prisma, {
    kind: "national",
  });

  if (zone.kind === "national") {
    return [{ role: AccessRole.EDITEUR, perimetreId: nationalPerimetreId }];
  }

  return [
    { role: AccessRole.VIEWER, perimetreId: nationalPerimetreId },
    {
      role: AccessRole.EDITEUR,
      perimetreId: await findOrCreatePerimetre(prisma, zone),
    },
  ];
};

export type AgentZone =
  | { kind: "national" }
  | { kind: "region"; regionId: number; name: string }
  | { kind: "departements"; departementNumeros: string[]; name: string };
