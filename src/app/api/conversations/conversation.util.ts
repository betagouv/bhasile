import { DomainError } from "@/app/utils/domain-error.util";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";
import type { ConversationTag } from "@/types/conversation.type";

export const getAuthorLevel = ({
  operateurId,
  grants,
}: {
  operateurId: number | null;
  grants: { scope: GrantScope; role: AccessRole }[];
}): AuthorLevel => {
  if (operateurId !== null) {
    return AuthorLevel.OPERATEUR;
  }
  const isRegionalEditor = grants.some(
    (grant) =>
      grant.scope === GrantScope.REGION && grant.role !== AccessRole.LECTEUR
  );
  return isRegionalEditor ? AuthorLevel.REGION : AuthorLevel.DEPARTEMENT;
};

export const assertCanAccessVisibility = (
  level: AuthorLevel,
  visibility: Visibility
): void => {
  if (level === AuthorLevel.OPERATEUR && visibility === Visibility.AGENTS) {
    throw new DomainError(
      "Les échanges entre agents ne sont pas accessibles à l'opérateur",
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
  assertCanAccessVisibility(level, visibility);
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
