"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { ReactElement, useState } from "react";

import { ApiError } from "@/app/utils/api-error.util";
import { ConversationTag } from "@/types/conversation.type";

import { TagSelect } from "./TagSelect";

export const MessageTag = ({
  tagKey,
  tags,
  canTag,
  onTagChange,
}: Props): ReactElement | null => {
  const [isChanging, setIsChanging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleTagChange = async (newTagKey: string | null) => {
    setIsChanging(true);
    setErrorMessage(undefined);
    try {
      await onTagChange(newTagKey);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Le tag n’a pas pu être modifié."
      );
    } finally {
      setIsChanging(false);
    }
  };

  if (canTag) {
    return (
      <div className="mb-2">
        <TagSelect
          tags={tags}
          value={tagKey}
          isDisabled={isChanging}
          errorMessage={errorMessage}
          onChange={handleTagChange}
        />
      </div>
    );
  }
  if (!tagKey) {
    return null;
  }
  return (
    <Tag small className="mb-2">
      {tags.find((tag) => tag.key === tagKey)?.label ?? tagKey}
    </Tag>
  );
};

type Props = {
  tagKey: string | null;
  tags: ConversationTag[];
  canTag: boolean;
  onTagChange: (tagKey: string | null) => Promise<void>;
};
