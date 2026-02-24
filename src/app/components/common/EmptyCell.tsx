import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";

export const EmptyCell = ({ className }: Props): ReactElement => {
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="w-2 h-2 bg-disabled-grey rounded-lg m-4" />
    </div>
  );
};

type Props = {
  className?: string;
};
