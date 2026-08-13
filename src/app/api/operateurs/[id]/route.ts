import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { operateurWriteApiSchema } from "@/schemas/api/operateur.schema";

import { createOperateurEvent } from "../../user-actions/user-action.service";
import { updateOperateur } from "../operateur.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = operateurWriteApiSchema.parse({ ...body, id: Number(id) });
    const operateur = await updateOperateur(result);
    createOperateurEvent(request.method, operateur.id);
    return NextResponse.json({ operateurId: operateur.id }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
