import { NextResponse } from "next/server";

import { createStatistiquesCartographieEvent } from "@/app/api/user-actions/user-action.service";

export async function POST() {
  createStatistiquesCartographieEvent("GET");
  return NextResponse.json({});
}
