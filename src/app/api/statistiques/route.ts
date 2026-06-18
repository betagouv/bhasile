import { NextRequest, NextResponse } from "next/server";

import { StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import { StatistiquesPerimetreVideError } from "./shared/errors";
import { getStatistiques } from "./statistique.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: StatistiquesFiltersRaw = {
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
    aggregation: searchParams.get("aggregation"),
  };

  try {
    const result = await getStatistiques(filters);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StatistiquesPerimetreVideError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
