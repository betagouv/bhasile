import { NextRequest, NextResponse } from "next/server";

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
    console.error("Error in GET /api/cpoms/[id]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
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
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
