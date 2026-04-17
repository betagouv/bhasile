import { NextRequest, NextResponse } from "next/server";

import { operateurWriteApiSchema } from "@/schemas/api/operateur.schema";

import { createOperateurEvent } from "../../user-action/user-action.service";
import { updateOne } from "../operateur.repository";
import { getOperateur } from "../operateur.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operateur = await getOperateur(Number(id));

    if (!operateur) {
      return NextResponse.json(
        { error: "Opérateur non trouvé" },
        { status: 404 }
      );
    }
    createOperateurEvent(request.method, operateur.id);

    return NextResponse.json(operateur);
  } catch (error) {
    console.error("Error in GET /api/operateurs/[id]", error);
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
  const { id } = await params;
  try {
    const body = await request.json();
    const result = operateurWriteApiSchema.parse(body);
    const operateur = await updateOne(result);
    createOperateurEvent(request.method, Number(id));
    return NextResponse.json({ operateurId: operateur.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
