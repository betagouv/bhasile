import { KeyboardEvent, ReactElement, ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";
import { ConversationVisibility } from "@/types/conversation.type";

import { ECHANGES_PANEL_ID } from "./EchangesLayout";

export const ChannelTabs = ({
  selected,
  tabs,
  onSelect,
}: Props): ReactElement => {
  const selectOtherTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      onSelect(selected === "SHARED" ? "AGENTS" : "SHARED");
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Canal des échanges"
      className="shrink-0 flex border-0 border-b border-solid border-active-blue-france"
    >
      {tabs.map(({ visibility, label }) => {
        const isSelected = visibility === selected;
        return (
          <button
            key={visibility}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={ECHANGES_PANEL_ID}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(visibility)}
            onKeyDown={selectOtherTab}
            className={cn(
              "flex-1 px-6 pt-4 pb-5 text-sm font-bold uppercase text-title-blue-france",
              isSelected && "border-0 border-b-4 border-solid border-active-blue-france"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

type Props = {
  selected: ConversationVisibility;
  tabs: { visibility: ConversationVisibility; label: ReactNode }[];
  onSelect: (visibility: ConversationVisibility) => void;
};
