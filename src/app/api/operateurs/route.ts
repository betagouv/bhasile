import { NextRequest, NextResponse } from "next/server";

import { getOperateurs } from "./operateur.service";

export async function GET(request: NextRequest) {
  const pageParam = Number(request.nextUrl.searchParams.get("page"));
  const page = Number.isInteger(pageParam) ? pageParam : null;
  const search = request.nextUrl.searchParams.get("search");
  const { operateurs, totalOperateurs } = await getOperateurs({ page, search });
  return NextResponse.json({ operateurs, totalOperateurs });
}
