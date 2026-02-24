import { ReactElement } from "react";

export const NoDataAccordion = ({
  title,
  description,
}: Props): ReactElement => {
  return (
    <div className="flex justify-between w-full px-4 py-3">
      <span className="text-title-blue-france font-medium">{title}</span>
      <span className="text-mention-grey italic fr-pr-1w">{description}</span>
    </div>
  );
};

type Props = {
  title: string;
  description: string;
};
