import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { cpomApiSchema } from "@/schemas/api/cpom.schema";

import { createCpomEvent } from "../../user-actions/user-action.service";
import { saveCpom } from "../cpom.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = cpomApiSchema.parse({ ...body, id: Number(id) });
    const cpomId = await saveCpom(result);
    createCpomEvent(request.method, cpomId);
    return NextResponse.json({ cpomId }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
