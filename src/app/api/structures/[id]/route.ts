import { NextRequest, NextResponse } from "next/server";

import { findOne } from "../structure.repository";
import { computeStructure } from "../structure.service";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop();
    const dbStructure = await findOne(Number(id));

    if (!dbStructure) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    const structure = computeStructure(dbStructure);

    return NextResponse.json(structure);
  } catch (error) {
    console.error("Error in GET /api/structures/[id]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
