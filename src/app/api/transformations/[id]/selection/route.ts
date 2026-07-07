import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { canUpdateTransformation } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { transformationSelectionApiUpdateSchema } from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

import {
  getTransformation,
  resetTransformationSelection,
} from "../../transformation.service";

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
    const result = transformationSelectionApiUpdateSchema.parse({
      ...body,
      id: Number(id),
    });

    const transformation = await getTransformation(result.id);
    if (!transformation) {
      return NextResponse.json(
        { error: "Transformation non trouvée" },
        { status: 404 }
      );
    }
    if (!canUpdateTransformation(session.user as SessionUser, transformation)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const transformationId = await resetTransformationSelection(result);
    return NextResponse.json({ transformationId }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
