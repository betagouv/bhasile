import { ReactElement } from "react";

export const NoDataAccordion = ({
  title,
  description,
}: Props): ReactElement => {
  return (
    <div className="flex justify-between w-full px-4 py-3 border-b border-b-border-default-grey border-t border-t-border-default-grey">
      <span className="text-title-blue-france font-medium">{title}</span>
      <span className="text-mention-grey italic fr-pr-1w">{description}</span>
    </div>
  );
};

type Props = {
  title: string;
  description: string;
};
