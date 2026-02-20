import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { PropsWithChildren, ReactElement, ReactNode } from "react";

export const CustomAccordion = ({ label, children }: Props): ReactElement => {
  return (
    <Accordion
      label={label}
      className="[&>div]:bg-(--background-alt-blue-france) [&>div]:p-0 [&>div]:m-0 [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_thead::after]:bg-none [&_tbody::after]:bg-none"
    >
      {children || ""}
    </Accordion>
  );
};

type Props = PropsWithChildren<{
  label: string | ReactNode;
}>;
