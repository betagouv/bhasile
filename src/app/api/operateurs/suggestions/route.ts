import { NextRequest, NextResponse } from "next/server";

import { getOperateursSuggestions } from "../operateur.service";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search");
  const operateurs = await getOperateursSuggestions(search);
  return NextResponse.json(operateurs);
}
