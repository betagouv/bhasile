import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  getAnomalieForUpdate,
  setAnomalieJustification,
} from "@/app/api/anomalies/anomalie.service";
import { createStructureEvent } from "@/app/api/user-actions/user-action.service";
import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { anomalieApiUpdateSchema } from "@/schemas/api/anomalie.schema";
import { SessionUser } from "@/types/global";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const input = anomalieApiUpdateSchema.parse({ ...body, id: Number(id) });

    // Le moteur supprime les anomalies qui ne sont plus détectées : l'absence est un état normal.
    const anomalie = await getAnomalieForUpdate(input.id);
    if (anomalie === null) {
      return NextResponse.json(
        { error: "Anomalie introuvable" },
        { status: 404 }
      );
    }

    if (
      !canUpdateDepartement(
        session.user as SessionUser,
        anomalie.departementAdministratif
      )
    ) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    await setAnomalieJustification(input, session.user.email);
    createStructureEvent(request.method, anomalie.structureId);

    return NextResponse.json("Anomalie mise à jour avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
