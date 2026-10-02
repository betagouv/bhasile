import { NextResponse } from "next/server";

import { getFaqItems } from "./faq.service";

export async function GET() {
  const { faqItems } = await getFaqItems();
  return NextResponse.json({ faqItems });
}
