import Accordion from "@codegouvfr/react-dsfr/Accordion";
import MarkdownIt from "markdown-it";
import { ReactElement } from "react";

import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqTab } from "@/types/ressources.type";

const markdownParser = new MarkdownIt({ html: true });

export const FaqTabPanel = ({ tab }: Props): ReactElement | null => {
  const faqItemsToDisplay = tab.items ?? [];

  if (faqItemsToDisplay.length === 0) {
    return null;
  }

  return (
    <>
      {faqItemsToDisplay.map((faqItem: FaqApiType) => (
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
