import { NextRequest, NextResponse } from "next/server";

import { createCpomEvent } from "@/app/api/user-actions/user-action.service";
import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { cpomApiAjoutSchema } from "@/schemas/api/cpom.schema";

import { saveCpom } from "./cpom.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomApiAjoutSchema.parse(body);
    const cpomId = await saveCpom(result);
    createCpomEvent(request.method, cpomId);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
