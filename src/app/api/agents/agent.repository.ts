import prisma from "@/lib/prisma";

const agentSelect = {
  id: true,
  email: true,
  name: true,
  isActivated: true,
  deactivatedAt: true,
  lastConnection: true,
  perimeter: { select: { id: true, name: true } },
} as const;

const manageableAgentWhere = { operateurId: null, isSuperAdmin: false };

export const findAgents = () =>
  prisma.user.findMany({
    where: manageableAgentWhere,
    orderBy: { email: "asc" },
    select: agentSelect,
  });

export const findAgentById = (id: number) =>
  prisma.user.findFirst({
    where: { id, ...manageableAgentWhere },
    select: agentSelect,
  });

export const findUserIdByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email }, select: { id: true } });

export const createActivatedAgent = (email: string, perimeterId: number) =>
  prisma.user.create({
    data: { email, perimeterId, isActivated: true },
    select: { id: true },
  });

export const activateAgent = (id: number, perimeterId: number) =>
  prisma.user.update({
    where: { id },
    data: { perimeterId, isActivated: true, deactivatedAt: null },
  });

export const deactivateAgent = (id: number, deactivatedAt: Date) =>
  prisma.user.update({
    where: { id },
    data: { isActivated: false, deactivatedAt },
  });
