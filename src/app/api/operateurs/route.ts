import { NextRequest, NextResponse } from "next/server";

import { countOperateurs } from "./operateur.repository";
import { getOperateurs } from "./operateur.service";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const operateurs = await getOperateurs({ page });
  const totalOperateurs = await countOperateurs();
  return NextResponse.json({ operateurs, totalOperateurs });
}
