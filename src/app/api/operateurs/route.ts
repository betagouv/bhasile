import { NextRequest, NextResponse } from "next/server";

import { countOperateurs } from "./operateur.repository";
import { getOperateurs } from "./operateur.service";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const search = request.nextUrl.searchParams.get("search");
  const operateurs = await getOperateurs({ page, search });
  const totalOperateurs = await countOperateurs({ search });
  return NextResponse.json({ operateurs, totalOperateurs });
}
