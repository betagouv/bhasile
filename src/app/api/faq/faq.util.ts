import { DomainError } from "@/app/utils/domain-error.util";
import { parseId } from "@/app/utils/string.util";

export const faqItemNotFound = (): DomainError =>
  new DomainError("Question introuvable", 404);

export const parseFaqItemId = async (
  params: Promise<{ id: string }>
): Promise<number> => {
  const id = parseId((await params).id);
  if (id === null) {
    throw faqItemNotFound();
  }
  return id;
};
