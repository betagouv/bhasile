import { NextRequest, NextResponse } from "next/server";

import { findByDnaCode } from "../../structure.repository";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.pathname.split("/").pop();

  if (!code) {
    return NextResponse.json(
      { error: "DNA code is required" },
      { status: 400 }
    );
  }

  try {
    const structure = await findByDnaCode(code);

    if (!structure) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(structure);
  } catch (error) {
    console.error("Error fetching structure by DNA code:", error);
    return NextResponse.json(
      { error: "Failed to fetch structure" },
      { status: 500 }
    );
  }
}
