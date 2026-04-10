import { NextRequest, NextResponse } from "next/server";

import { getOperateurs } from "./operateur.service";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const operateurs = await getOperateurs({ page });
  return NextResponse.json({ operateurs, totalOperateurs: operateurs.length });
}
