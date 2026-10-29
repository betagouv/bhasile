import { Fragment, ReactElement } from "react";

import { AUTHOR_LEVEL_LABELS } from "@/constants";
import { MessageApiRead } from "@/schemas/api/message.schema";
import { ConversationTag } from "@/types/conversation.type";

import { MessageAttachment } from "./MessageAttachment";
import { MessageTag } from "./MessageTag";

export const MessageItem = ({
  message,
  tags,
  canTag,
  onTagChange,
}: Props): ReactElement => (
  <li className="bg-white p-4 rounded border border-solid border-default-grey">
    <p className="text-sm mb-1">
      <strong>{message.author.name ?? "Utilisateur"}</strong>
      {" · "}
      {AUTHOR_LEVEL_LABELS[message.authorLevel]}
      {" · "}
      <time dateTime={message.createdAt}>
        {formatMessageDate(message.createdAt)}
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
            <span title={`Le ${formatMessageDate(receipt.createdAt)}`}>
              {receipt.user.name ?? "Utilisateur"}
            </span>
          </Fragment>
        ))}
      </p>
    )}
  </li>
);

const PARIS_DATE_TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  dateStyle: "short",
  timeStyle: "short",
});

const formatMessageDate = (isoDate: string): string =>
  PARIS_DATE_TIME_FORMAT.format(new Date(isoDate));

type Props = {
  message: MessageApiRead;
  tags: ConversationTag[];
  canTag: boolean;
  onTagChange: (tagKey: string | null) => Promise<void>;
};
