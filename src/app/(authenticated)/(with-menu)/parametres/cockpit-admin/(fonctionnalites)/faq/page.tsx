import { ReactElement } from "react";

import { getFaqItems } from "@/app/api/faq/faq.service";

import { FaqManager } from "./_components/FaqManager";

export default async function CockpitAdminFaq(): Promise<ReactElement> {
  const { faqItems } = await getFaqItems();

  return <FaqManager faqItems={faqItems} />;
}
