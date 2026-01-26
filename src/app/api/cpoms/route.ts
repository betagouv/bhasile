import { NextRequest, NextResponse } from "next/server";

import { cpomApiSchema } from "@/schemas/api/cpom.schema";

import { createOrUpdateCpom } from "./cpom.repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomApiSchema.parse(body);
    await createOrUpdateCpom(result);
    return NextResponse.json("Structure créée avec succès", { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
