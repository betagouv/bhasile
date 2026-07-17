import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { transformationApiCreateSchema } from "@/schemas/api/transformation.schema";

import { createTransformation } from "./transformation.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = transformationApiCreateSchema.parse(body);
    const transformationId = await createTransformation(result);
    return NextResponse.json({ transformationId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
