import { NextRequest, NextResponse } from "next/server";

import { findBySearchTerm } from "../operateur.repository";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search");
  const operateurs = await findBySearchTerm(search);
  return NextResponse.json(operateurs);
}
