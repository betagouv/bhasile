import { NextRequest, NextResponse } from "next/server";

import { addAgent } from "@/app/api/agents/agent.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { assertAgentsManagementAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { agentApiCreateSchema } from "@/schemas/api/agent.schema";

export async function POST(request: NextRequest) {
  try {
    assertAgentsManagementAccess(await getSessionUser());
    const input = agentApiCreateSchema.parse(await request.json());

    await addAgent(input, request.method);

    return NextResponse.json("Agent ajouté avec succès", { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
