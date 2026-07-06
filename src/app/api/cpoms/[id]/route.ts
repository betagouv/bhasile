import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { cpomApiSchema } from "@/schemas/api/cpom.schema";

import { createCpomEvent } from "../../user-action/user-action.service";
import { getCpomById, saveCpom } from "../cpom.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cpom = await getCpomById(Number(id));
    if (!cpom) {
      return NextResponse.json({ error: "CPOM non trouvé" }, { status: 404 });
    }

    return NextResponse.json(cpom);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
