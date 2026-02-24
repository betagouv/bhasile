import { ReactElement } from "react";

import { AccordionTitle } from "@/app/components/AccordionTitle";
import { CustomAccordion } from "@/app/components/common/CustomAccordion";

export const ControleAccordion = ({
  title,
  lastVisit,
  children,
}: Props): ReactElement => {
  return (
    <CustomAccordion
      label={<AccordionTitle title={title} lastVisit={lastVisit} />}
    >
      {children}
    </CustomAccordion>
  );
};

type Props = {
  title: string;
  lastVisit?: string;
  children: ReactElement;
};
