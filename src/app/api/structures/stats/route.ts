import { NextResponse } from "next/server";

import {
  getMaxPlacesAutorisees,
  getMinPlacesAutorisees,
} from "../structure.service";

export async function GET() {
  const maxPlacesAutorisees = await getMaxPlacesAutorisees();
  const minPlacesAutorisees = await getMinPlacesAutorisees();

  return NextResponse.json({
    maxPlacesAutorisees,
    minPlacesAutorisees,
  });
}
