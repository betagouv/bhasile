import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";

import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqTab } from "@/types/ressources.type";
import { renderFaqMarkdown } from "@/utils/faq.util";

export const FaqTabPanel = ({ tab, faqItems }: Props): ReactElement | null => {
  const filteredFaqItems = faqItems.filter(
    (faqItem: FaqApiType) => faqItem.category === tab.title
  );

  return (
    <>
      {filteredFaqItems.map((faqItem: FaqApiType) => (
        <Accordion key={faqItem.id} label={faqItem.question}>
          <div
            dangerouslySetInnerHTML={{
              __html: renderFaqMarkdown(faqItem.contentMarkdown),
            }}
          />
        </Accordion>
      ))}
    </>
  );
};

type Props = {
  tab: FaqTab;
  faqItems: FaqApiType[];
};
