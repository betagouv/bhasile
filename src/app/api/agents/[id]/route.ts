import { NextRequest, NextResponse } from "next/server";

import { updateAgentAccess } from "@/app/api/agents/agent.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { parseId } from "@/app/utils/string.util";
import { assertAgentsManagementAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { agentApiUpdateSchema } from "@/schemas/api/agent.schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAgentsManagementAccess(await getSessionUser());
    const id = parseId((await params).id);
    if (id === null) {
      throw new DomainError("Agent introuvable", 404);
    }
    const input = agentApiUpdateSchema.parse(await request.json());

    await updateAgentAccess(id, input, request.method);

    return NextResponse.json("Accès mis à jour avec succès", { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
