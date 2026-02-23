import { NextRequest, NextResponse } from "next/server";

import { findOne } from "../cpom.repository";
import { computeCpom } from "../cpom.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbCpom = await findOne(Number(id));

    if (!dbCpom) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    const cpom = computeCpom(dbCpom);

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
