import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";

import { createStructureEvent } from "../../user-action/user-action.service";
import {
  getFullStructure,
  getStructureForOperateur,
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
      ? await getFullStructure(Number(id))
      : await getStructureForOperateur(Number(id));

    createStructureEvent(request.method, structure.id);

    if (!structure) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(structure);
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
