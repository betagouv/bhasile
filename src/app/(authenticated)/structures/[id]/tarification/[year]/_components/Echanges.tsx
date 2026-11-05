"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactElement, useState } from "react";

import { VISIBILITY_LABELS } from "@/constants";
import { useMessageDraft } from "@/hooks/useMessageDraft";
import {
  ConversationAnchor,
  ConversationTag,
  ConversationVisibility,
} from "@/types/conversation.type";

import { ChannelTabs } from "./ChannelTabs";
import { Conversation } from "./Conversation";
import { EchangesDrawer } from "./EchangesDrawer";
import { UnreadCountBadge } from "./UnreadCountBadge";

export const Echanges = ({
  structureId,
  year,
  currentUserId,
  isOperateur,
  canParticipate,
  isCampaignOpen,
  tags,
  anchorsByVisibility,
  unreadCounts,
}: Props): ReactElement => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const sharedDraft = useMessageDraft();
  const agentsDraft = useMessageDraft();

  const isAgentsChannel =
    !isOperateur && searchParams.get(CHANNEL_PARAM) === AGENTS_CHANNEL;
  const visibility: ConversationVisibility = isAgentsChannel
    ? "AGENTS"
    : "SHARED";
  const draft = isAgentsChannel ? agentsDraft : sharedDraft;
  const isOpen = searchParams.has(CHANNEL_PARAM);

  const [seenVisibilities, setSeenVisibilities] = useState<
    ConversationVisibility[]
  >([]);
  if (isOpen && !seenVisibilities.includes(visibility)) {
    setSeenVisibilities([...seenVisibilities, visibility]);
  }
  const getUnreadCount = (channel: ConversationVisibility): number =>
    seenVisibilities.includes(channel) ? 0 : unreadCounts[channel];

  const updateChannel = (channel: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (channel) {
      params.set(CHANNEL_PARAM, channel);
    } else {
      params.delete(CHANNEL_PARAM);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : pathname);
  };

  const conversation = (
    <Conversation
      key={`${structureId}-${year}-${visibility}`}
      structureId={structureId}
      year={year}
      visibility={visibility}
      currentUserId={currentUserId}
      canParticipate={canParticipate}
      isCampaignOpen={isCampaignOpen}
      tags={tags}
      anchors={anchorsByVisibility[visibility]}
      canTag={!isOperateur}
      draft={draft}
      tabs={
        isOperateur ? undefined : (
          <ChannelTabs
            selected={visibility}
            tabs={[
              {
                visibility: "SHARED",
                label: (
                  <>
                    {VISIBILITY_LABELS.SHARED}
                    <UnreadCountBadge count={getUnreadCount("SHARED")} />
                  </>
                ),
              },
              {
                visibility: "AGENTS",
                label: (
                  <>
                    {VISIBILITY_LABELS.AGENTS}
                    <UnreadCountBadge count={getUnreadCount("AGENTS")} />
                  </>
                ),
              },
            ]}
            onSelect={(selectedVisibility) =>
              updateChannel(
                selectedVisibility === "AGENTS"
                  ? AGENTS_CHANNEL
                  : SHARED_CHANNEL
              )
            }
          />
        )
      }
      onClose={() => updateChannel(null)}
    />
  );

  return (
    <>
      <Button
        iconId="fr-icon-question-answer-line"
        onClick={() => updateChannel(SHARED_CHANNEL)}
        className="fixed bottom-[7.5rem] right-0 z-30 rounded-l-full! p-[1.125rem]! shadow-[0_4px_6px_rgba(0,0,18,0.16)]"
      >
        Échanges
        <UnreadCountBadge
          count={getUnreadCount("SHARED") + getUnreadCount("AGENTS")}
        />
      </Button>
      {isOpen && (
        <EchangesDrawer onClose={() => updateChannel(null)}>
          {conversation}
        </EchangesDrawer>
      )}
    </>
  );
};

const CHANNEL_PARAM = "canal";
const SHARED_CHANNEL = "tous";
const AGENTS_CHANNEL = "agents";

type Props = {
  structureId: number;
  year: number;
  currentUserId: number;
  isOperateur: boolean;
  canParticipate: boolean;
  isCampaignOpen: boolean;
  tags: ConversationTag[];
  anchorsByVisibility: Record<ConversationVisibility, ConversationAnchor[]>;
  unreadCounts: Record<ConversationVisibility, number>;
};
