import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement } from "react";

import { ConversationTag } from "@/types/conversation.type";

export const TagSelect = ({
  tags,
  value,
  isDisabled = false,
  errorMessage,
  onChange,
}: Props): ReactElement => (
  <Select
    label="Tag"
    className="mb-0"
    disabled={isDisabled}
    state={errorMessage ? "error" : "default"}
    stateRelatedMessage={errorMessage}
    nativeSelectProps={{
      value: value ?? "",
      onChange: (event) => onChange(event.target.value || null),
    }}
  >
    <option value="">Aucun tag</option>
    {tags.map((tag) => (
      <option key={tag.key} value={tag.key}>
        {tag.label}
      </option>
    ))}
  </Select>
);

type Props = {
  tags: ConversationTag[];
  value: string | null;
  isDisabled?: boolean;
  errorMessage?: string;
  onChange: (tagKey: string | null) => void;
};
