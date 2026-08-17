import { NextResponse } from "next/server";

import { createStructuresCartographieEvent } from "@/app/api/user-actions/user-action.service";

export async function POST() {
  createStructuresCartographieEvent("GET");
  return NextResponse.json({});
}
