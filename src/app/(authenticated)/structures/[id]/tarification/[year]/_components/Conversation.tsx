"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement, ReactNode, useEffect, useRef } from "react";

import Loader from "@/app/components/ui/Loader";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { MessageDraft } from "@/hooks/useMessageDraft";
import {
  ConversationAnchor,
  ConversationTag,
  ConversationVisibility,
} from "@/types/conversation.type";
import { buildConversationThread } from "@/utils/conversation.util";

import { ConversationAnchorSeparator } from "./ConversationAnchorSeparator";
import { ConversationSummary } from "./ConversationSummary";
import { EchangesLayout } from "./EchangesLayout";
import { MessageComposer } from "./MessageComposer";
import { MessageItem } from "./MessageItem";
import { ReadOnlyNotice } from "./ReadOnlyNotice";

export const Conversation = ({
  structureId,
  year,
  visibility,
  currentUserId,
  canParticipate,
  isCampaignOpen,
  tags,
  anchors,
  canTag,
  draft,
  tabs,
  onClose,
}: Props): ReactElement => {
  const {
    messages,
    hasLoadingError,
    hasLostAccess,
    postMessage,
    markAsRead,
    changeTag,
  } = useConversationMessages({ structureId, year, visibility });
  const canTagMessages =
    canTag && canParticipate && isCampaignOpen && tags.length > 0;

  const requestedReceiptIdsRef = useRef(new Set<number>());
  const listRef = useRef<HTMLOListElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (!messages || !canParticipate) {
      return;
    }
    const requestedReceiptIds = requestedReceiptIdsRef.current;
    const unreadMessageIds = messages
      .filter(
        (message) =>
          message.author.id !== currentUserId &&
          !message.receipts.some(
            (receipt) => receipt.user.id === currentUserId
          ) &&
          !requestedReceiptIds.has(message.id)
      )
      .map((message) => message.id);
    if (unreadMessageIds.length === 0) {
      return;
    }
    unreadMessageIds.forEach((messageId) => requestedReceiptIds.add(messageId));
    markAsRead(unreadMessageIds).catch(() => {
      unreadMessageIds.forEach((messageId) =>
        requestedReceiptIds.delete(messageId)
      );
    });
  }, [messages, canParticipate, currentUserId, markAsRead]);

  useEffect(() => {
    const list = listRef.current;
    if (list && isAtBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    isAtBottomRef.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <
      SCROLL_BOTTOM_TOLERANCE_PX;
  };

  if (hasLostAccess) {
    return (
      <EchangesLayout tabs={tabs} onClose={onClose}>
        <Alert
          severity="error"
          small
          description="Votre session a expiré ou vous n’avez plus accès à ces échanges. Rechargez la page pour vous reconnecter."
        />
      </EchangesLayout>
    );
  }

  if (!messages) {
    return (
      <EchangesLayout tabs={tabs} onClose={onClose}>
        {hasLoadingError ? (
          <Alert
            severity="error"
            small
            description="Les échanges n’ont pas pu être chargés. Nouvel essai dans quelques secondes."
          />
        ) : (
          <Loader />
        )}
      </EchangesLayout>
    );
  }

  const thread = buildConversationThread(messages, anchors);

  return (
    <EchangesLayout
      summary={<ConversationSummary thread={thread} />}
      tabs={tabs}
      onClose={onClose}
    >
      {hasLoadingError && (
        <Alert
          severity="warning"
          small
          description="Les échanges ne sont plus actualisés. Nouvel essai dans quelques secondes."
        />
      )}
      {thread.length === 0 ? (
        <p className="grow mb-0 text-mention-grey">
          Aucun message pour l’instant.
        </p>
      ) : (
        <ol
          ref={listRef}
          onScroll={handleScroll}
          aria-label="Messages"
          className="grow min-h-0 overflow-y-auto list-none p-0 m-0 flex flex-col gap-3 [--ol-content:none]"
        >
          {thread.map((item) =>
            item.kind === "anchor" ? (
              <ConversationAnchorSeparator
                key={item.elementId}
                elementId={item.elementId}
                label={item.label}
                date={item.date}
                isMajor={item.isMajor}
              />
            ) : (
              <MessageItem
                key={item.elementId}
                elementId={item.elementId}
                message={item.message}
                isOwn={item.message.author.id === currentUserId}
                tags={tags}
                canTag={canTagMessages}
                onTagChange={(tagKey) => changeTag(item.message.id, tagKey)}
              />
            )
          )}
        </ol>
      )}
      {!isCampaignOpen && <ReadOnlyNotice year={year} />}
      {isCampaignOpen && canParticipate && (
        <MessageComposer
          tags={tags}
          canTag={canTagMessages}
          draft={draft}
          onSend={postMessage}
        />
      )}
    </EchangesLayout>
  );
};

const SCROLL_BOTTOM_TOLERANCE_PX = 40;

type Props = {
  structureId: number;
  year: number;
  visibility: ConversationVisibility;
  currentUserId: number;
  canParticipate: boolean;
  isCampaignOpen: boolean;
  tags: ConversationTag[];
  anchors: ConversationAnchor[];
  canTag: boolean;
  draft: MessageDraft;
  tabs?: ReactNode;
  onClose: () => void;
};
