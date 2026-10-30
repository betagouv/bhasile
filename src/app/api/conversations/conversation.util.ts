import { DomainError } from "@/app/utils/domain-error.util";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";
import type { ConversationTag } from "@/types/conversation.type";

export const getAuthorLevel = ({
  isAgent,
  grants,
}: {
  isAgent: boolean;
  grants: { scope: GrantScope; role: AccessRole }[];
}): AuthorLevel => {
  if (!isAgent) {
    return AuthorLevel.OPERATEUR;
  }
  const isRegionalEditor = grants.some(
    (grant) =>
      grant.scope === GrantScope.REGION && grant.role !== AccessRole.LECTEUR
  );
  return isRegionalEditor ? AuthorLevel.REGION : AuthorLevel.DEPARTEMENT;
};

export const assertCanAccessVisibility = (
  isAgent: boolean,
  visibility: Visibility
): void => {
  if (!isAgent && visibility === Visibility.AGENTS) {
    throw new DomainError(
      "Les échanges entre agents sont réservés aux agents",
      403
    );
  }
};

export const assertCanPostMessage = (
  {
    level,
    visibility,
    tagKey,
  }: { level: AuthorLevel; visibility: Visibility; tagKey: string | null },
  tags: ConversationTag[]
): void => {
  assertCanAccessVisibility(level !== AuthorLevel.OPERATEUR, visibility);
  if (tagKey !== null) {
    assertCanTag(level);
    assertTagKnown(tagKey, tags);
  }
};

export const assertCanTag = (authorLevel: AuthorLevel): void => {
  if (authorLevel === AuthorLevel.OPERATEUR) {
    throw new DomainError("Seuls les agents peuvent étiqueter un message", 403);
  }
};

export const assertTagKnown = (
  tagKey: string,
  tags: ConversationTag[]
): void => {
  if (!tags.some((tag) => tag.key === tagKey)) {
    throw new DomainError(`Étiquette inconnue : ${tagKey}`);
  }
};
