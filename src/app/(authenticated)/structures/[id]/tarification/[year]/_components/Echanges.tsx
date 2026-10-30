"use client";

import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { useSearchParamsNavigation } from "@/app/hooks/useSearchParamsNavigation";
import { VISIBILITY_LABELS } from "@/constants";
import { useMessageDraft } from "@/hooks/useMessageDraft";
import {
  ConversationTag,
  ConversationVisibility,
} from "@/types/conversation.type";

import { Conversation } from "./Conversation";

export const Echanges = ({
  structureId,
  year,
  currentUserId,
  isOperateur,
  isCampaignOpen,
  tags,
}: Props): ReactElement => {
  const searchParams = useSearchParams();
  const navigateWithParams = useSearchParamsNavigation();
  const sharedDraft = useMessageDraft();
  const agentsDraft = useMessageDraft();

  const isAgentsChannel =
    !isOperateur && searchParams.get(CHANNEL_PARAM) === AGENTS_CHANNEL;
  const visibility: ConversationVisibility = isAgentsChannel
    ? "AGENTS"
    : "SHARED";
  const draft = isAgentsChannel ? agentsDraft : sharedDraft;

  const handleTabChange = (tabId: string) => {
    navigateWithParams((params) =>
      tabId === "AGENTS"
        ? params.set(CHANNEL_PARAM, AGENTS_CHANNEL)
        : params.delete(CHANNEL_PARAM)
    );
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
      canTag={!isOperateur}
      draft={draft}
    />
  );

  return (
    <section className="flex flex-col gap-4">
      <h1 className="fr-h4 mb-0">Échanges</h1>
      {isOperateur ? (
        conversation
      ) : (
        <Tabs
          selectedTabId={visibility}
          onTabChange={handleTabChange}
          tabs={[
            { tabId: "SHARED", label: VISIBILITY_LABELS.SHARED },
            { tabId: "AGENTS", label: VISIBILITY_LABELS.AGENTS },
          ]}
          className="bg-white"
        >
          {conversation}
        </Tabs>
      )}
    </section>
  );
};

const CHANNEL_PARAM = "canal";
const AGENTS_CHANNEL = "agents";

type Props = {
  structureId: number;
  year: number;
  currentUserId: number;
  isOperateur: boolean;
  isCampaignOpen: boolean;
  tags: ConversationTag[];
};
