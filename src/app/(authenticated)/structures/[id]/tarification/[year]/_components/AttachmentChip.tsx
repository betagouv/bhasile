import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { formatBytes } from "@/app/utils/number.util";
import { AttachmentDraft } from "@/hooks/useMessageAttachments";

export const AttachmentChip = ({
  attachment,
  canRemove,
  onRemove,
}: Props): ReactElement => (
  <li
    className={cn(
      "flex items-center gap-2 rounded border border-solid py-1 pl-3 pr-1 text-sm",
      attachment.status === "error"
        ? "border-plain-error"
        : "border-default-grey"
    )}
  >
    <span className="flex flex-col">
      <span>{attachment.name}</span>
      <span
        role="status"
        className={cn(
          "text-xs",
          attachment.status === "error"
            ? "text-default-error"
            : "text-mention-grey"
        )}
      >
        {getAttachmentStatusLabel(attachment)}
      </span>
    </span>
    <Button
      type="button"
      iconId="fr-icon-close-line"
      priority="tertiary no outline"
      size="small"
      title={`Retirer ${attachment.name}`}
      disabled={!canRemove}
      onClick={onRemove}
    />
  </li>
);

const getAttachmentStatusLabel = (attachment: AttachmentDraft): string => {
  if (attachment.status === "uploading") {
    return "Envoi en cours…";
  }
  if (attachment.status === "error") {
    return attachment.errorMessage;
  }
  return formatBytes(attachment.size);
};

type Props = {
  attachment: AttachmentDraft;
  canRemove: boolean;
  onRemove: () => void;
};
