import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// import { isAgent } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { statistiquesFiltersSchema } from "@/schemas/api/statistique.schema";
import { SessionUser } from "@/types/global";

import { getStatistiques } from "./statistique.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = session.user as SessionUser;
  // const isOperateurUser = !isAgent(user);

  const { searchParams } = request.nextUrl;

  const filters = statistiquesFiltersSchema.parse({
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
    aggregation: searchParams.get("aggregation"),
  });

  const result = await getStatistiques(filters, user);
  return NextResponse.json(result);
}
