import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";

import { createStructureEvent } from "../../user-action/user-action.service";
import { findOne, findOneOperateur } from "../structure.repository";
import {
  addPresencesIndues,
  StructureWithFileUploadsAndActivites,
} from "../structure.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const doBypass =
      process.env.NODE_ENV !== "production" &&
      (process.env.DEV_AUTH_BYPASS ||
        request.headers.get("x-dev-auth-bypass") === "1");

    const isAuthenticated = !!session?.user || doBypass;

    const id = request.nextUrl.pathname.split("/").pop();
    const structure = isAuthenticated
      ? await findOne(Number(id))
      : await findOneOperateur(Number(id));

    createStructureEvent(request.method, structure.id);

    if (!structure) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    const structureWithPresencesIndues = isAuthenticated
      ? addPresencesIndues(structure as StructureWithFileUploadsAndActivites)
      : structure;

    return NextResponse.json(structureWithPresencesIndues);
  } catch (error) {
    console.error("Error in GET /api/structures/[id]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
