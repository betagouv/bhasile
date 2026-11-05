"use client";

import { ReactElement, useState } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { formatBytes } from "@/app/utils/number.util";
import { MessageApiRead } from "@/schemas/api/message.schema";

export const MessageAttachment = ({ attachment }: Props): ReactElement => {
  const { getDownloadLink } = useFileUpload();
  const [hasOpeningError, setHasOpeningError] = useState(false);

  const openAttachment = async () => {
    setHasOpeningError(false);
    try {
      const link = await getDownloadLink(attachment.key);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      setHasOpeningError(true);
    }
  };

  return (
    <li className="text-sm">
      <button
        type="button"
        onClick={openAttachment}
        className="underline text-title-blue-france text-left"
      >
        {attachment.originalName}
      </button>
      <span className="text-mention-grey">
        {" "}
        {[
          getFileExtension(attachment.originalName),
          formatBytes(attachment.fileSize),
        ]
          .filter(Boolean)
          .join(" – ")}
      </span>
      {hasOpeningError && (
        <span role="alert" className="block text-xs text-default-error">
          Le fichier n’a pas pu être ouvert. Réessayez dans quelques instants.
        </span>
      )}
    </li>
  );
};

const getFileExtension = (fileName: string): string =>
  fileName.includes(".") ? (fileName.split(".").pop() ?? "").toUpperCase() : "";

type Props = {
  attachment: MessageApiRead["attachments"][number];
};
