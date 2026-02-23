import { NextRequest, NextResponse } from "next/server";

import { findOne } from "../structure.repository";
import {
  addPresencesIndues,
  divideFileUploads,
  StructureWithFileUploadsAndActivites,
} from "../structure.service";
import { computeStructure } from "../structure.util";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop();
    const structure = await findOne(Number(id));

    if (!structure) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    const computedStructure = computeStructure(structure);

    return NextResponse.json(computedStructure);
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
