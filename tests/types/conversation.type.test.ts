import { describe, expect, it } from "vitest";

import { Visibility } from "@/generated/prisma/enums";
import { ConversationVisibility } from "@/types/conversation.type";

describe("ConversationVisibility", () => {
  it("reprend exactement les canaux de l'enum Prisma", () => {
    expect([...ConversationVisibility].sort()).toEqual(
      Object.values(Visibility).sort()
    );
  });
});
