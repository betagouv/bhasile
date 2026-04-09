import { NextRequest, NextResponse } from "next/server";

import { findAll } from "./dna-codes.repository";

export async function GET(request: NextRequest) {
  const free = request.nextUrl.searchParams.get("free") === "true";
  const structureId = Number(request.nextUrl.searchParams.get("structureId"));

  if (!structureId || isNaN(structureId)) {
    return NextResponse.json(
      { error: "StructureID doit être défini et être un nombre" },
      { status: 400 }
    );
  }

  try {
    const [dnaCodes] = await Promise.all([
      findAll({
        free,
        structureId,
      }),
    ]);
    return NextResponse.json(dnaCodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dna codes" },
      { status: 500 }
    );
  }
}
