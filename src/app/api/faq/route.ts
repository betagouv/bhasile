import { NextResponse } from "next/server";

import { getFaqItems } from "./faq.repository";

export async function GET() {
  const { faqItems } = await getFaqItems();

  return NextResponse.json({ faqItems });
}
