import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";

import { AccordionTitle } from "@/app/components/AccordionTitle";

export const ControleAccordion = ({
  title,
  lastVisit,
  children,
}: Props): ReactElement => {
  return (
    <Accordion
      label={<AccordionTitle title={title} lastVisit={lastVisit} />}
      className="custom-accordion"
    >
      {children}
    </Accordion>
  );
};

type Props = {
  title: string;
  lastVisit?: string;
  children: ReactElement;
};
