import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { structureAgentUpdateApiSchema } from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";

import { createStructureEvent } from "../../../user-action/user-action.service";
import { getActualisationYear } from "../../actualisation.util";
import {
  getStructureDepartement,
  updateActualisation,
} from "../../structure.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const year = getActualisationYear();
    if (year === null) {
      return NextResponse.json(
        { error: "Aucune campagne d'actualisation ouverte" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const input = structureAgentUpdateApiSchema.parse({
      ...body,
      id: Number(id),
    });

    const departementAdministratif = await getStructureDepartement(input.id);
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

    const updatedStructure = await updateActualisation(input, year);
    createStructureEvent(request.method, updatedStructure.id);

    return NextResponse.json("Structure actualisée avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
