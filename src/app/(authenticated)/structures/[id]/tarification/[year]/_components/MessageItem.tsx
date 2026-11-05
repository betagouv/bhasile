import { Fragment, ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import { formatDateAndTime, formatDateTime } from "@/app/utils/date.util";
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
      "p-0 w-[92%] flex flex-col gap-3 pb-4 rounded-[10px] bg-white",
      isOwn ? "self-end" : "self-start"
    )}
  >
    <div className="flex items-center justify-between gap-4 flex-wrap pl-4 pr-3 py-2 rounded-t-[10px] bg-action-low-blue-france">
      <span className="flex items-center gap-2 text-sm text-title-blue-france">
        <strong>{message.author.name ?? "Utilisateur"}</strong>
        {" – "}
        <Badge
          type={message.authorLevel === "OPERATEUR" ? "pink" : "yellow"}
        >
          {AUTHOR_LEVEL_LABELS[message.authorLevel]}
        </Badge>
      </span>
      <time dateTime={message.createdAt} className="text-sm font-bold text-title-grey">
        {formatDateAndTime(message.createdAt)}
      </time>
    </div>
    {tags.length > 0 && (
      <div className="px-4">
        <MessageTag
          tagKey={message.tagKey}
          tags={tags}
          canTag={canTag}
          onTagChange={onTagChange}
        />
      </div>
    )}
    {message.text && (
      <p className="px-4 whitespace-pre-wrap text-sm mb-0">{message.text}</p>
    )}
    {message.attachments.length > 0 && (
      <ul
        aria-label="Pièces jointes du message"
        className="list-none px-4 m-0 flex flex-col items-start gap-1"
      >
        {message.attachments.map((attachment) => (
          <MessageAttachment key={attachment.id} attachment={attachment} />
        ))}
      </ul>
    )}
    {message.receipts.length > 0 && (
      <p className="px-4 text-xs text-mention-grey mb-0">
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
