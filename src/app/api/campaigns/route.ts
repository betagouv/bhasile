import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { campaignApiWriteSchema } from "@/schemas/api/campaign.schema";
import { SessionUser } from "@/types/global";

import { getStructureDepartement } from "../structures/structure.service";
import { saveActualisationCampaign } from "./campaign.service";
import { getActualisationYear } from "./campaign.util";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const input = campaignApiWriteSchema.parse(body);

    if (input.year !== getActualisationYear()) {
      return NextResponse.json(
        { error: "Année d'actualisation non ouverte" },
        { status: 400 }
      );
    }

    const departementAdministratif = await getStructureDepartement(
      input.structureId
    );
    if (
      !canUpdateDepartement(
        session.user as SessionUser,
        departementAdministratif
      )
    ) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const campaign = await saveActualisationCampaign(input);
    return NextResponse.json(campaign, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
