import { NextRequest, NextResponse } from "next/server";

import { transformationApiCreateSchema } from "@/schemas/api/transformation.schema";

import { createTransformation } from "./transformation.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = transformationApiCreateSchema.parse(body);
    const id = await createTransformation(result);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
