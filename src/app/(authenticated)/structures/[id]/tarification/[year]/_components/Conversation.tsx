"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement, useEffect, useRef } from "react";

import Loader from "@/app/components/ui/Loader";
import { formatDateTime } from "@/app/utils/date.util";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { MessageDraft } from "@/hooks/useMessageDraft";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import {
  ConversationAnchor,
  ConversationTag,
  ConversationVisibility,
} from "@/types/conversation.type";
import { buildConversationThread } from "@/utils/conversation.util";

import { ConversationSummary } from "./ConversationSummary";
import { MessageComposer } from "./MessageComposer";
import { MessageItem } from "./MessageItem";
import { MessageSearchBar } from "./MessageSearchBar";
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
  searchQuery,
  onSearchQueryChange,
}: Props): ReactElement => {
  const {
    messages,
    hasLoadingError,
    hasLostAccess,
    postMessage,
    markAsRead,
    changeTag,
  } = useConversationMessages({ structureId, year, visibility });
  const canTagMessages = canTag && canParticipate && isCampaignOpen;

  const requestedReceiptIdsRef = useRef(new Set<number>());
  const listRef = useRef<HTMLOListElement>(null);
  const isAtBottomRef = useRef(true);

  const {
    searchWords,
    resultCount,
    resultPosition,
    currentResultId,
    isResult,
    goToOlderResult,
    goToNewerResult,
  } = useMessageSearch({ messages, searchQuery, listRef });

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
    if (list && isAtBottomRef.current && currentResultId === null) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, currentResultId]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    isAtBottomRef.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <
      SCROLL_BOTTOM_TOLERANCE_PX;
  };

  const sendMessage: typeof postMessage = async (message) => {
    await postMessage(message);
    isAtBottomRef.current = true;
  };

  const searchBar = (
    <MessageSearchBar
      value={searchQuery}
      onChange={onSearchQueryChange}
      isSearching={searchWords.length > 0}
      resultCount={resultCount}
      resultPosition={resultPosition}
      onOlderResult={goToOlderResult}
      onNewerResult={goToNewerResult}
    />
  );

  if (hasLostAccess) {
    return (
      <Alert
        severity="error"
        small
        description="Votre session a expiré ou vous n’avez plus accès à ces échanges. Rechargez la page pour vous reconnecter."
      />
    );
  }

  if (!messages) {
    return hasLoadingError ? (
      <Alert
        severity="error"
        small
        description="Les échanges n’ont pas pu être chargés. Nouvel essai dans quelques secondes."
      />
    ) : (
      <div className="flex flex-col gap-4">
        {searchBar}
        <Loader />
      </div>
    );
  }

  const thread = buildConversationThread(messages, anchors);

  return (
    <div className="flex flex-col gap-4">
      {searchBar}
      {hasLoadingError && (
        <Alert
          severity="warning"
          small
          description="Les échanges ne sont plus actualisés. Nouvel essai dans quelques secondes."
        />
      )}
      <div className="flex gap-4 h-[calc(100dvh-30rem)] min-h-64">
        <ConversationSummary thread={thread} />
        {thread.length === 0 ? (
          <p className="mb-0 text-mention-grey">
            Aucun message pour l’instant.
          </p>
        ) : (
          <ol
            ref={listRef}
            onScroll={handleScroll}
            aria-label="Messages"
            className="grow min-w-0 overflow-y-auto list-none p-0 m-0 flex flex-col gap-3 [--ol-content:none]"
          >
            {thread.map((item) =>
              item.kind === "anchor" ? (
                <li
                  key={item.elementId}
                  id={item.elementId}
                  className="self-center p-0 text-xs text-mention-grey text-center"
                >
                  {item.label}
                  {" · "}
                  <time dateTime={item.date.toISOString()}>
                    {formatDateTime(item.date)}
                  </time>
                </li>
              ) : (
                <MessageItem
                  key={item.elementId}
                  elementId={item.elementId}
                  message={item.message}
                  isOwn={item.message.author.id === currentUserId}
                  tags={tags}
                  canTag={canTagMessages}
                  onTagChange={(tagKey) => changeTag(item.message.id, tagKey)}
                  searchWords={isResult(item.message.id) ? searchWords : []}
                  isCurrentResult={item.message.id === currentResultId}
                />
              )
            )}
          </ol>
        )}
      </div>
      {!isCampaignOpen && <ReadOnlyNotice year={year} />}
      {isCampaignOpen && canParticipate && (
        <MessageComposer
          tags={tags}
          canTag={canTagMessages}
          draft={draft}
          onSend={sendMessage}
        />
      )}
    </div>
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
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
};
