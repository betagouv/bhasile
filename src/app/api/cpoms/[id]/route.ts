import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { canSaveCpom } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { cpomApiSchema } from "@/schemas/api/cpom.schema";
import { SessionUser } from "@/types/global";

import { createCpomEvent } from "../../user-actions/user-action.service";
import { getCpomScope, saveCpom } from "../cpom.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = cpomApiSchema.parse({ ...body, id: Number(id) });

    const existingCpom = result.id ? await getCpomScope(result.id) : null;
    if (!existingCpom) {
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
    return NextResponse.json({ cpomId }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
