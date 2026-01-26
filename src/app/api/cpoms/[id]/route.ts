import { NextRequest, NextResponse } from "next/server";

import { findOne } from "../cpom.repository";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop();
    const cpom = await findOne(Number(id));

    if (!cpom) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
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
