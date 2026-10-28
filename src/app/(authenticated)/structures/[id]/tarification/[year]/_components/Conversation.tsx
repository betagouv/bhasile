"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement, useEffect, useRef } from "react";

import Loader from "@/app/components/ui/Loader";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { ConversationVisibility } from "@/types/conversation.type";

import { MessageComposer } from "./MessageComposer";
import { MessageItem } from "./MessageItem";
import { ReadOnlyNotice } from "./ReadOnlyNotice";

export const Conversation = ({
  structureId,
  year,
  visibility,
  currentUserId,
  isSuperAdmin,
  isCampaignOpen,
}: Props): ReactElement => {
  const { messages, hasLoadingError, hasLostAccess, postMessage, markAsRead } =
    useConversationMessages({ structureId, year, visibility });
  const isReadOnly = !isCampaignOpen || isSuperAdmin;

  const requestedReceiptIdsRef = useRef(new Set<number>());
  const listRef = useRef<HTMLOListElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (!messages || isSuperAdmin) {
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
  }, [messages, isSuperAdmin, currentUserId, markAsRead]);

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
      <Loader />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasLoadingError && (
        <Alert
          severity="warning"
          small
          description="Les échanges ne sont plus actualisés. Nouvel essai dans quelques secondes."
        />
      )}
      {messages.length === 0 ? (
        <p className="mb-0 text-mention-grey">Aucun message pour l’instant.</p>
      ) : (
        <ol
          ref={listRef}
          onScroll={handleScroll}
          aria-label="Messages"
          className="max-h-[60vh] overflow-y-auto list-none p-0 m-0 flex flex-col gap-3"
        >
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </ol>
      )}
      {isReadOnly ? (
        <ReadOnlyNotice year={year} isCampaignOpen={isCampaignOpen} />
      ) : (
        <MessageComposer onSend={postMessage} />
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
  isSuperAdmin: boolean;
  isCampaignOpen: boolean;
};
