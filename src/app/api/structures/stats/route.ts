import { NextResponse } from "next/server";

import { getBoundsPlacesAutorisees } from "../structure.service";

export async function GET() {
  const now = new Date();
  const { min: minPlacesAutorisees, max: maxPlacesAutorisees } =
    await getBoundsPlacesAutorisees(now);

  return NextResponse.json({
    maxPlacesAutorisees,
    minPlacesAutorisees,
  });
}
