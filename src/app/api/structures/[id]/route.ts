import { NextRequest, NextResponse } from "next/server";

import { structureLastCpom } from "../../cpoms/cpom.service";
import { findOne } from "../structure.repository";
import {
  addPresencesIndues,
  divideFileUploads,
  StructureWithFileUploadsAndActivites,
} from "../structure.service";

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

    const structureWithPresencesIndues = addPresencesIndues(
      structure as StructureWithFileUploadsAndActivites
    );
    const structureWithDividedFileUploads = divideFileUploads(
      structureWithPresencesIndues
    );
    const lastCpom = await structureLastCpom(structure.id);
    return NextResponse.json({
      ...structureWithDividedFileUploads,
      lastCpom,
    });
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
