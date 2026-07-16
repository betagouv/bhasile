import Notice from "@codegouvfr/react-dsfr/Notice";
import { ReactElement, ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";

export const CustomNotice = ({
  severity,
  className,
  description,
}: Props): ReactElement => {
  return (
    <Notice
      severity={severity}
      title=""
      className={cn(
        "[&_p]:flex [&_p]:items-center rounded-lg",
        "[&_div_div]:px-4 [&_div_div]:py-3 [&_div]:px-0 py-0",
        className
      )}
      description={description}
    />
  );
};

type Props = {
  severity: "info" | "warning" | "alert";
  className?: string;
  description: ReactNode;
};
