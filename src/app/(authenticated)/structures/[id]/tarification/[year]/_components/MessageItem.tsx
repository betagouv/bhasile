import { Fragment, ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { formatDateTime } from "@/app/utils/date.util";
import { AUTHOR_LEVEL_LABELS } from "@/constants";
import { MessageApiRead } from "@/schemas/api/message.schema";
import { ConversationTag } from "@/types/conversation.type";

import { MessageAttachment } from "./MessageAttachment";
import { MessageTag } from "./MessageTag";

export const MessageItem = ({
  elementId,
  message,
  isOwn,
  tags,
  canTag,
  onTagChange,
}: Props): ReactElement => (
  <li
    id={elementId}
    className={cn(
      "max-w-[85%] p-4 rounded border border-solid border-default-grey",
      isOwn ? "self-end bg-alt-blue-france" : "self-start bg-white"
    )}
  >
    <p className="text-sm mb-1">
      <strong>{message.author.name ?? "Utilisateur"}</strong>
      {isOwn && <span className="fr-sr-only"> (vous)</span>}
      {" · "}
      {AUTHOR_LEVEL_LABELS[message.authorLevel]}
      {" · "}
      <time dateTime={message.createdAt}>
        {formatDateTime(message.createdAt)}
      </time>
    </p>
    <MessageTag
      tagKey={message.tagKey}
      tags={tags}
      canTag={canTag}
      onTagChange={onTagChange}
    />
    {message.text && <p className="whitespace-pre-wrap mb-0">{message.text}</p>}
    {message.attachments.length > 0 && (
      <ul
        aria-label="Pièces jointes du message"
        className="list-none p-0 mt-2 mb-0 flex flex-col gap-1"
      >
        {message.attachments.map((attachment) => (
          <MessageAttachment key={attachment.id} attachment={attachment} />
        ))}
      </ul>
    )}
    {message.receipts.length > 0 && (
      <p className="text-xs text-mention-grey mt-2 mb-0">
        Lu par{" "}
        {message.receipts.map((receipt, receiptIndex) => (
          <Fragment key={receipt.user.id}>
            {receiptIndex > 0 && ", "}
            <span title={`Le ${formatDateTime(receipt.createdAt)}`}>
              {receipt.user.name ?? "Utilisateur"}
            </span>
          </Fragment>
        ))}
      </p>
    )}
  </li>
);

type Props = {
  elementId: string;
  message: MessageApiRead;
  isOwn: boolean;
  tags: ConversationTag[];
  canTag: boolean;
  onTagChange: (tagKey: string | null) => Promise<void>;
};
