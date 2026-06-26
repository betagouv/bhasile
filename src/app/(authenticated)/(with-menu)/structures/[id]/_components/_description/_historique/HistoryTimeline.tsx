import { ReactElement } from "react";

import { HistoryEvent } from "@/types/structure-history.type";

import { HistoryEventItem } from "./HistoryEventItem";

export const HistoryTimeline = ({ events }: Props): ReactElement => (
  <ol className="flex flex-col">
    {events.map((event, index) => (
      <HistoryEventItem
        key={`${event.kind}-${event.date}`}
        event={event}
        isLast={index === events.length - 1}
      />
    ))}
  </ol>
);

type Props = {
  events: HistoryEvent[];
};
