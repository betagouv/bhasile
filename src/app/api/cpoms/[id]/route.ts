import { NextRequest, NextResponse } from "next/server";

import { getCpomById } from "../cpom.service";

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
