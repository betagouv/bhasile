import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";

import { FaqTab } from "@/types/ressources.type";

export const FaqTabPanel = ({ tab }: Props): ReactElement => {
  return (
    <>
      {tab.questions.map((question) => (
        <Accordion key={question.id} label={question.title}>
          <div dangerouslySetInnerHTML={{ __html: question.answerHtml }} />
        </Accordion>
      ))}
    </>
  );
};

type Props = {
  tab: FaqTab;
};
