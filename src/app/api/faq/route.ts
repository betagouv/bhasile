import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { addFaqItem } from "@/app/api/faq/faq.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { canAccessCockpitAdmin } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { faqApiWriteSchema } from "@/schemas/api/faq.schema";
import { SessionUser } from "@/types/global";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!canAccessCockpitAdmin(session.user as SessionUser)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const input = faqApiWriteSchema.parse(await request.json());
    const faqItemId = await addFaqItem(input);

    return NextResponse.json({ faqItemId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
