import { NextRequest, NextResponse } from "next/server";

import { addFaqItem } from "@/app/api/faq/faq.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { assertCockpitAdminAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { faqApiWriteSchema } from "@/schemas/api/faq.schema";

export async function POST(request: NextRequest) {
  try {
    assertCockpitAdminAccess(await getSessionUser());
    const input = faqApiWriteSchema.parse(await request.json());

    await addFaqItem(input);

    return NextResponse.json("Question créée avec succès", { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
