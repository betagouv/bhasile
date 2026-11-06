import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { changeTarificationMessageTag } from "@/app/api/tarifications/tarification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import {
  messageApiUpdateSchema,
  messageParamsSchema,
} from "@/schemas/api/message.schema";
import { SessionUser } from "@/types/global";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { messageId } = messageParamsSchema.parse(await params);
    const { tagKey } = messageApiUpdateSchema.parse(await request.json());

    const message = await changeTarificationMessageTag({
      messageId,
      tagKey,
      user: session.user as SessionUser,
    });

    return NextResponse.json(message);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
