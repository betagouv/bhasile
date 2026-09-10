import Accordion from "@codegouvfr/react-dsfr/Accordion";
import MarkdownIt from "markdown-it";
import { ReactElement } from "react";

import { useFaq } from "@/app/hooks/useFaq";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqTab } from "@/types/ressources.type";

const md = new MarkdownIt({ html: true });

export const FaqTabPanel = ({ tab }: Props): ReactElement => {
  const { faqItems } = useFaq();

  const items = Array.isArray(faqItems) ? faqItems : [];
  console.log(">>>>>>>", tab);

  return (
    <>
      {items.map((faqItem: FaqApiType) => (
        <Accordion key={faqItem.id} label={faqItem.question}>
          <div
            dangerouslySetInnerHTML={{
              __html: md.render(faqItem.contentMarkdown),
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
