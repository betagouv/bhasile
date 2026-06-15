import { NextRequest, NextResponse } from "next/server";

import { StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import { getStatistiques } from "./statistique.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: StatistiquesFiltersRaw = {
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
  };

  const result = await getStatistiques(filters);
  return NextResponse.json(result);
}
