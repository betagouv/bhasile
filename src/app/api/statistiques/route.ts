import { NextRequest, NextResponse } from "next/server";

import { statistiquesFiltersSchema } from "@/schemas/api/statistique.schema";

import { createStatistiquesEvent } from "../user-action/user-action.service";
import { getStatistiques } from "./statistique.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters = statistiquesFiltersSchema.parse({
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
    aggregation: searchParams.get("aggregation"),
  });

  const result = await getStatistiques(filters);
  createStatistiquesEvent(request.method);
  return NextResponse.json(result);
}
