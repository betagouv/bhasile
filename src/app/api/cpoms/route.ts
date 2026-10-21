import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { createCpomEvent } from "@/app/api/user-actions/user-action.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { canSaveCpom } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { cpomApiAjoutSchema } from "@/schemas/api/cpom.schema";
import { SessionUser } from "@/types/global";

import { getCpomScope, saveCpom } from "./cpom.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = cpomApiAjoutSchema.parse(body);

    const existingCpom = result.id ? await getCpomScope(result.id) : null;
    if (result.id && !existingCpom) {
      return NextResponse.json({ error: "CPOM introuvable" }, { status: 404 });
    }
    if (!canSaveCpom(session.user as SessionUser, result, existingCpom)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const cpomId = await saveCpom(result);
    createCpomEvent(request.method, cpomId);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
