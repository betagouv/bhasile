import { NextResponse } from "next/server";

import { getNow } from "@/app/utils/now.util";

import { getBoundsPlacesAutorisees } from "../structure.service";

export async function GET() {
  const now = getNow();
  const { min: minPlacesAutorisees, max: maxPlacesAutorisees } =
    await getBoundsPlacesAutorisees(now);

  return NextResponse.json({
    maxPlacesAutorisees,
    minPlacesAutorisees,
  });
}
