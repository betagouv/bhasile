import { DomainError } from "@/app/utils/domain-error.util";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";
import type {
  ConversationTag,
  PendingMessageNotification,
} from "@/types/conversation.type";

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

export const buildDigests = (
  pendingMessages: PendingMessageNotification[],
  notifiedOrReadPairs: MessageUser[]
): MessageDigest[] => {
  const excludedKeys = new Set(notifiedOrReadPairs.map(toMessageUserKey));
  const digestsByUserId = new Map<number, DigestDraft>();
  for (const {
    messageId,
    conversationId,
    recipients,
    params,
  } of pendingMessages) {
    for (const { userId, email } of recipients) {
      if (excludedKeys.has(toMessageUserKey({ messageId, userId }))) {
        continue;
      }
      const digest: DigestDraft = digestsByUserId.get(userId) ?? {
        userId,
        email,
        messageIds: [],
        conversationsById: new Map(),
      };
      digest.messageIds.push(messageId);
      const conversation = digest.conversationsById.get(conversationId) ?? {
        ...params,
        nombre: 0,
      };
      conversation.nombre += 1;
      digest.conversationsById.set(conversationId, conversation);
      digestsByUserId.set(userId, digest);
    }
  }
  return [...digestsByUserId.values()].map(
    ({ conversationsById, ...digest }) => ({
      ...digest,
      conversations: [...conversationsById.values()],
    })
  );
};

const toMessageUserKey = ({ messageId, userId }: MessageUser): string =>
  `${messageId}:${userId}`;

type MessageUser = { messageId: number; userId: number };

type DigestConversation = Record<string, string | number> & { nombre: number };

type DigestDraft = Omit<MessageDigest, "conversations"> & {
  conversationsById: Map<number, DigestConversation>;
};

type MessageDigest = {
  userId: number;
  email: string;
  messageIds: number[];
  conversations: DigestConversation[];
};
