import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { UserActionCategory } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";

import prisma from "../lib/prisma";
import { monitoredRoutes } from "./user-event-config";

const getIsMonitored = (pathname: string, method: string): boolean => {
  for (const monitoredRoute of monitoredRoutes) {
    if (monitoredRoute.pattern.test(pathname)) {
      const isMonitored = monitoredRoute.routes.find((m) => m === method);
      return isMonitored !== undefined;
    }
  }
  return false;
};

const getActionFromMethod = (method: string): UserActionCategory => {
  const methods: Record<string, UserActionCategory> = {
    GET: UserActionCategory.READ,
    POST: UserActionCategory.CREATE,
    PUT: UserActionCategory.CREATE,
    DELETE: UserActionCategory.DELETE,
  };
  return methods[method];
};

export const auditLoggingProxy = async (
  request: NextRequest
): Promise<void> => {
  try {
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    const isMonitored = getIsMonitored(pathname, method);

    if (!isMonitored) {
      return;
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      console.error("Pas d'utilisateur enregistré avec cet email");
    }

    await prisma.userAction.create({
      data: {
        userId: user?.id || 0,
        action: getActionFromMethod(method),
        entityName: pathname.split("/")[2],
        entityId: Number(pathname.split("/")[3]),
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création d'un événement utilisateur",
      error
    );
  }
};
