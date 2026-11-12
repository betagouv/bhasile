import { NextRequest, NextResponse } from "next/server";

import { renameFaqCategory } from "@/app/api/faq/faq.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { assertCockpitAdminAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { faqCategoryApiUpdateSchema } from "@/schemas/api/faq.schema";

export async function PUT(request: NextRequest) {
  try {
    assertCockpitAdminAccess(await getSessionUser());
    const input = faqCategoryApiUpdateSchema.parse(await request.json());

    await renameFaqCategory(input);

    return NextResponse.json("Catégorie renommée avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
