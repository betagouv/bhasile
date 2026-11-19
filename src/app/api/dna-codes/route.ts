import { NextRequest, NextResponse } from "next/server";

import { dnaCodesFiltersSchema } from "@/schemas/api/dna-code.schema";

import { getDnaCodes } from "./dna-codes.service";

export async function GET(request: NextRequest) {
  const { structureId, structureVersionId, ...filters } =
    dnaCodesFiltersSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

  try {
    const dnaCodes = await getDnaCodes({
      entityId: { structureId, structureVersionId },
      ...filters,
    });
    return NextResponse.json(dnaCodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec de la récupération des codes DNA" },

      { status: 500 }
    );
  }
}
