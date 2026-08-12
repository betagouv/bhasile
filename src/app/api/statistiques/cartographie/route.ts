import { NextRequest, NextResponse } from "next/server";

import {
  CartographieNotImplementedApiRead,
  statistiqueCartographieFiltersSchema,
} from "@/schemas/api/statistique-cartographie.schema";

import { createStatistiquesCartographieEvent } from "../../user-action/user-action.service";
import { getCartographieStatistiques } from "./cartographie.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const parsed = statistiqueCartographieFiltersSchema.safeParse({
    granularite: searchParams.get("granularite"),
    indicateur: searchParams.get("indicateur"),
    annee: searchParams.get("annee"),
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
    aggregation: searchParams.get("aggregation"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_PARAMS", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const filters = parsed.data;

  if (filters.granularite === "arrondissement") {
    const body: CartographieNotImplementedApiRead = {
      error: "NOT_IMPLEMENTED",
      message:
        "La cartographie par arrondissement n'est pas encore disponible (aucun modèle de données correspondant).",
    };
    return NextResponse.json(body, { status: 501 });
  }

  const result = await getCartographieStatistiques({
    ...filters,
    granularite: filters.granularite,
  });
  createStatistiquesCartographieEvent(request.method);
  return NextResponse.json(result);
}
