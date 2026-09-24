import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";

import { getFaqItems } from "./faq.service";

export async function GET() {
  try {
    const { faqItems } = await getFaqItems();
    return NextResponse.json(faqItems);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
