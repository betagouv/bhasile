import { NextRequest, NextResponse } from "next/server";

import { EntityId } from "@/types/Entity.type";

import { getDnaCodes } from "./dna-codes.service";

export async function GET(request: NextRequest) {
  const entityId: EntityId = {
    structureId:
      Number(request.nextUrl.searchParams.get("structureId")) || undefined,
    structureVersionId:
      Number(request.nextUrl.searchParams.get("structureVersionId")) ||
      undefined,
  };

  try {
    const dnaCodes = await getDnaCodes(entityId);
    return NextResponse.json(dnaCodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec de la récupération des codes DNA" },

      { status: 500 }
    );
  }
}
