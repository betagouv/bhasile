import Accordion from "@codegouvfr/react-dsfr/Accordion";
import MarkdownIt from "markdown-it";
import { ReactElement } from "react";

import { useFaq } from "@/app/hooks/useFaq";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqTab } from "@/types/ressources.type";

const markdownParser = new MarkdownIt({ html: true });

export const FaqTabPanel = ({ tab }: Props): ReactElement | null => {
  const { faqItems } = useFaq();

  const itemsList = Array.isArray(faqItems) ? faqItems : [];

  const filteredFaqItems = itemsList.filter(
    (faqItem: FaqApiType) => faqItem.category === tab.title
  );

  return (
    <>
      {filteredFaqItems.map((faqItem: FaqApiType) => (
        <Accordion key={faqItem.id} label={faqItem.question}>
          <div
            dangerouslySetInnerHTML={{
              __html: markdownParser.render(faqItem.contentMarkdown),
            }}
          />
        </Accordion>
      ))}
    </>
  );
};

type Props = {
  tab: FaqTab;
};
