import Accordion from "@codegouvfr/react-dsfr/Accordion";

export const DocumentsFinanciersAccordion = ({
  hasAccordion,
  children,
  year,
  startYear,
}: Props) => {
  const shouldHide = startYear && year < startYear;
  if (shouldHide) {
    return null;
  }

  if (!hasAccordion) {
    return <>{children}</>;
  }
  return (
    <Accordion
      label={year}
      className="[&_.fr-collapse]:m-0 [&_.fr-collapse]:p-0"
    >
      <div className="p-6">{children}</div>
    </Accordion>
  );
};

type Props = {
  hasAccordion?: boolean;
  children: React.ReactElement;
  year: number;
  startYear: number;
};
