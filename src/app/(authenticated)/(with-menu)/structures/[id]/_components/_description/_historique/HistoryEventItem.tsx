import { ReactElement } from "react";

import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
import { formatDate } from "@/app/utils/date.util";
import { HistoryEvent } from "@/types/structure-history.type";

import { HistoryEventLabel } from "./HistoryEventLabel";

export const HistoryEventItem = ({ event, isLast }: Props): ReactElement => {
  const [day, month, year] = formatDate(event.date).split("/");

  return (
    <li className="flex gap-3">
      <div className="flex w-12 shrink-0 flex-col items-end pt-0.5 leading-tight text-title-blue-france">
        <span className="text-xs">
          {day}/{month}
        </span>
        <span className="font-bold">{year}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-title-blue-france">
          <StructureEventIcon kind={event.kind} />
        </span>
        {!isLast && (
          <span
            aria-hidden
            className="my-1 w-px grow bg-[var(--border-default-grey)]"
          />
        )}
      </div>
      <div className="pt-1 pb-6">
        <HistoryEventLabel event={event} />
      </div>
    </li>
  );
};

type Props = {
  event: HistoryEvent;
  isLast: boolean;
};
