import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { formatDateAndTime } from "@/app/utils/date.util";

export const ConversationAnchorSeparator = ({
  elementId,
  label,
  date,
  isMajor,
}: Props): ReactElement => {
  const lineClassName = cn(
    "grow h-px",
    isMajor ? "bg-[var(--text-title-grey)]" : "bg-active-blue-france"
  );

  return (
    <li
      id={elementId}
      className={cn(
        "p-0 w-full flex items-center gap-5 text-sm text-center",
        isMajor ? "font-bold text-title-grey" : "text-title-blue-france"
      )}
    >
      <span aria-hidden className={lineClassName} />
      <span>
        {label}
        {!isMajor && (
          <>
            {" – le "}
            <time dateTime={date.toISOString()} className="font-bold">
              {formatDateAndTime(date)}
            </time>
          </>
        )}
      </span>
      <span aria-hidden className={lineClassName} />
    </li>
  );
};

type Props = {
  elementId: string;
  label: string;
  date: Date;
  isMajor: boolean;
};
