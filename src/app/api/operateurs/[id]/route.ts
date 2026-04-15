import { NextRequest, NextResponse } from "next/server";

import { createOperateurEvent } from "../../user-action/user-action.service";
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
