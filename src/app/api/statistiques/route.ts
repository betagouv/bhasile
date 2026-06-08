import { NextRequest, NextResponse } from "next/server";

import { getStatistiques } from "./statistique.service";
import { StatistiquesFiltersRaw } from "./statistique.type";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: StatistiquesFiltersRaw = {
    departements: searchParams.get("departements"),
    regions: searchParams.get("regions"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
  };

  const result = await getStatistiques(filters);
  return NextResponse.json(result);
}
