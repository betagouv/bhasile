import { ReactElement } from "react";

import { formatDateTime } from "@/app/utils/date.util";
import { ConversationThreadItem } from "@/utils/conversation.util";

export const ConversationSummary = ({ thread }: Props): ReactElement | null => {
  const entries = thread.filter(
    (item) => item.kind === "anchor" || item.message.attachments.length > 0
  );
  if (entries.length === 0) {
    return null;
  }
  return (
    <nav
      aria-label="Sommaire des échanges"
      className="hidden md:block w-56 shrink-0 overflow-y-auto"
    >
      <ol className="list-none p-0 m-0 flex flex-col gap-2 [--ol-content:none]">
        {entries.map((entry) => (
          <li key={entry.elementId} className="p-0">
            <button
              type="button"
              className="text-left text-sm"
              onClick={() =>
                document
                  .getElementById(entry.elementId)
                  ?.scrollIntoView({ block: "center" })
              }
            >
              {entry.kind === "anchor" ? entry.label : "Justificatif"}
              <time
                dateTime={entry.date.toISOString()}
                className="block text-xs text-mention-grey"
              >
                {formatDateTime(entry.date)}
              </time>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

type Props = {
  thread: ConversationThreadItem[];
};
