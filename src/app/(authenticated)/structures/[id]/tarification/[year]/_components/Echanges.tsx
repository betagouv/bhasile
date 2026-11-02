"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { VISIBILITY_LABELS } from "@/constants";
import { useMessageDraft } from "@/hooks/useMessageDraft";
import {
  ConversationAnchor,
  ConversationTag,
  ConversationVisibility,
} from "@/types/conversation.type";

import { Conversation } from "./Conversation";
import { EchangesDrawer } from "./EchangesDrawer";

export const Echanges = ({
  structureId,
  year,
  currentUserId,
  isOperateur,
  isCampaignOpen,
  tags,
  anchorsByVisibility,
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
      isCampaignOpen={isCampaignOpen}
      tags={tags}
      anchors={anchorsByVisibility[visibility]}
      canTag={!isOperateur}
      draft={draft}
    />
  );

  return (
    <>
      <Button
        iconId="fr-icon-question-answer-line"
        onClick={() => updateChannel(SHARED_CHANNEL)}
        className="fixed bottom-6 right-6 z-30"
      >
        Échanges
      </Button>
      {isOpen && (
        <EchangesDrawer onClose={() => updateChannel(null)}>
          {isOperateur ? (
            conversation
          ) : (
            <Tabs
              selectedTabId={visibility}
              onTabChange={(tabId) =>
                updateChannel(
                  tabId === "AGENTS" ? AGENTS_CHANNEL : SHARED_CHANNEL
                )
              }
              tabs={[
                { tabId: "SHARED", label: VISIBILITY_LABELS.SHARED },
                { tabId: "AGENTS", label: VISIBILITY_LABELS.AGENTS },
              ]}
              className="bg-white shrink-0 h-auto! before:h-auto! before:self-stretch"
            >
              {conversation}
            </Tabs>
          )}
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
  isCampaignOpen: boolean;
  tags: ConversationTag[];
  anchorsByVisibility: Record<ConversationVisibility, ConversationAnchor[]>;
};
