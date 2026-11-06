import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";
import { statistiquesFiltersSchema } from "@/schemas/api/statistique.schema";
import { SessionUser } from "@/types/global";

import { getStatistiques } from "./statistique.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { searchParams } = request.nextUrl;

  const filters = statistiquesFiltersSchema.parse({
    departements: searchParams.get("departements"),
    operateurs: searchParams.get("operateurs"),
    types: searchParams.get("types"),
    aggregation: searchParams.get("aggregation"),
  });

  const result = await getStatistiques(filters, session.user as SessionUser);
  return NextResponse.json(result);
}
