import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import { getBoundsPlacesAutorisees } from "../structure.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  const { min: minPlacesAutorisees, max: maxPlacesAutorisees } =
    await getBoundsPlacesAutorisees(session?.user as SessionUser | undefined);

  return NextResponse.json({
    maxPlacesAutorisees,
    minPlacesAutorisees,
  });
}
