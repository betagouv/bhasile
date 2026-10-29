import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { canUpdateOperateur } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { operateurWriteApiSchema } from "@/schemas/api/operateur.schema";
import { SessionUser } from "@/types/global";

import { createOperateurEvent } from "../../user-actions/user-action.service";
import { updateOperateur } from "../operateur.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = operateurWriteApiSchema.parse({ ...body, id: Number(id) });

    if (
      !result.id ||
      !canUpdateOperateur(session.user as SessionUser, result.id)
    ) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const operateur = await updateOperateur(result);
    createOperateurEvent(request.method, operateur.id);
    return NextResponse.json({ operateurId: operateur.id }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
