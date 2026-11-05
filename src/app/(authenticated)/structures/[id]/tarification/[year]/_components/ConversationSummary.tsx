import { ReactElement } from "react";

import { ConversationThreadItem } from "@/utils/conversation.util";

export const ConversationSummary = ({ thread }: Props): ReactElement | null => {
  const entries = thread.filter(
    (item) => item.kind === "anchor" || item.message.attachments.length > 0
  );
  if (entries.length === 0) {
    return null;
  }

  const scrollToEntry = (elementId: string) =>
    document
      .getElementById(elementId)
      ?.scrollIntoView({ block: "center" });

  return (
    <nav aria-label="Sommaire des échanges" className="hidden md:block">
      <ol className="list-none p-0 m-0 flex flex-col gap-1.5 [--ol-content:none]">
        {entries.map((entry) => (
          <li key={entry.elementId} className="p-0">
            <button
              type="button"
              onClick={() => scrollToEntry(entry.elementId)}
              className="flex items-baseline gap-3 w-full text-left text-xs text-title-blue-france"
            >
              {entry.kind === "anchor" ? (
                <>
                  <span
                    aria-hidden
                    className="shrink-0 w-4 h-px self-center bg-active-blue-france"
                  />
                  <span className="font-bold">{entry.label}</span>
                </>
              ) : (
                <>
                  <span aria-hidden className="shrink-0 w-4 text-center">
                    •
                  </span>
                  {entry.message.attachments.length > 1
                    ? "Documents joints"
                    : "Document joint"}
                </>
              )}
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
