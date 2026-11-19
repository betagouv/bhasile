import { NextRequest, NextResponse } from "next/server";

import { addPerimeter } from "@/app/api/perimeters/perimeter.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { assertAgentsManagementAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { perimeterApiCreateSchema } from "@/schemas/api/perimeter.schema";

export async function POST(request: NextRequest) {
  try {
    assertAgentsManagementAccess(await getSessionUser());
    const input = perimeterApiCreateSchema.parse(await request.json());

    const perimeter = await addPerimeter(input);

    return NextResponse.json(perimeter, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
