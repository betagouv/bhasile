import { NextResponse } from "next/server";

import { createStatistiquesEvent } from "@/app/api/user-actions/user-action.service";

export async function POST() {
  createStatistiquesEvent("GET");
  return NextResponse.json({});
}
