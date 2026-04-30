import { NextRequest, NextResponse } from "next/server";

import { getDnaCodes } from "./dna-codes.service";

export async function GET(request: NextRequest) {
  const structureId = Number(request.nextUrl.searchParams.get("structureId"));

  if (!structureId || isNaN(structureId)) {
    return NextResponse.json(
      { error: "StructureID doit être défini et être un nombre" },
      { status: 400 }
    );
  }

  try {
    const dnaCodes = await getDnaCodes(structureId);
    return NextResponse.json(dnaCodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec de la récupération des codes DNA" },

      { status: 500 }
    );
  }
}
