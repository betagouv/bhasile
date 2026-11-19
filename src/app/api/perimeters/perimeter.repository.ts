import { AccessRole } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { PerimeterApiCreate } from "@/schemas/api/perimeter.schema";

export const findPerimeters = () =>
  prisma.perimeter.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      grants: {
        select: {
          scope: true,
          regionId: true,
          departementNumero: true,
          region: { select: { name: true } },
          departement: { select: { name: true } },
        },
      },
    },
  });

export const findPerimeterIdByName = (name: string) =>
  prisma.perimeter.findUnique({ where: { name }, select: { id: true } });

export const findPerimeterById = (id: number) =>
  prisma.perimeter.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

export const createPerimeter = ({ name, ...zone }: PerimeterApiCreate) =>
  prisma.perimeter.create({
    data: {
      name,
      grants: { create: { role: AccessRole.ADMIN, ...zone } },
    },
    select: { id: true },
  });

export const findZones = async () => ({
  departements: await prisma.departement.findMany({
    orderBy: { numero: "asc" },
    select: { numero: true, name: true },
  }),
  regions: await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }),
});
