import { NextRequest, NextResponse } from "next/server";

import { getOperateurs } from "./operateur.service";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const search = request.nextUrl.searchParams.get("search");
  const { operateurs, totalOperateurs } = await getOperateurs({ page, search });
  return NextResponse.json({ operateurs, totalOperateurs });
}
