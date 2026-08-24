import { NextResponse } from "next/server";

import { getBoundsPlacesAutorisees } from "../structure.service";

export async function GET() {
  const { min: minPlacesAutorisees, max: maxPlacesAutorisees } =
    await getBoundsPlacesAutorisees();

  return NextResponse.json({
    maxPlacesAutorisees,
    minPlacesAutorisees,
  });
}
