import { NextRequest, NextResponse } from "next/server";

import { checkAdressesExistence } from "@/app/api/adresses/adresse.repository";

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hasAdresses = await checkAdressesExistence(Number(id));

    if (hasAdresses) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 404 });
    }
  } catch (error) {
    console.error("Error in HEAD /api/structures/[id]/adresses", error);
    return new NextResponse(null, { status: 500 });
  }
}
