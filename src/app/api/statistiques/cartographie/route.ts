import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { canAccessPage } from "@/lib/casl/pages";
import { authOptions } from "@/lib/next-auth/auth";
import {
  CartographieNotImplementedApiRead,
  statistiqueCartographieFiltersSchema,
} from "@/schemas/api/statistique-cartographie.schema";
import { SessionUser } from "@/types/global";

import { getCartographieStatistiques } from "./cartographie.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!canAccessPage(user, "/statistiques")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
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

  const result = await getCartographieStatistiques(
    {
      ...filters,
      granularite: filters.granularite,
    },
    user
  );
  return NextResponse.json(result);
}
