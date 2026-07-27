import prisma from "@/lib/prisma";

import { dashboardStructureSelect } from "./initialisations-actualisations.db.type";

export const findDashboardStructures = () =>
  prisma.structure.findMany({ select: dashboardStructureSelect });

export const findCampaignDeadline = (slug: string) =>
  prisma.campaignDefinition.findUnique({
    where: { slug },
    select: { deadline: true },
  });
