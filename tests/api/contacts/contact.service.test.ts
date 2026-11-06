import { beforeEach, describe, expect, it, vi } from "vitest";

import { getContactStructureIds } from "@/app/api/contacts/contact.service";

const mockFindStructuresWithContactEmail = vi.fn();

vi.mock("@/app/api/contacts/contact.repository", () => ({
  findStructuresWithContactEmail: (...args: unknown[]) =>
    mockFindStructuresWithContactEmail(...args),
}));

vi.mock("@/app/utils/now.util", () => ({
  getNow: () => new Date("2026-10-27T00:00:00.000Z"),
}));

const buildVersion = (
  id: number,
  effectiveDate: string | null,
  contactIds: number[]
) => ({
  id,
  effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
  structureVersionTransformationId: null,
  structureVersionTransformation: null,
  contacts: contactIds.map((contactId) => ({ id: contactId })),
});

describe("getContactStructureIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("garde les structures dont la version affichée a le contact", async () => {
    mockFindStructuresWithContactEmail.mockResolvedValueOnce([
      { id: 1, structureVersions: [buildVersion(10, null, [100])] },
    ]);

    expect(await getContactStructureIds(" Contact@Coallia.org ")).toEqual([1]);
    expect(mockFindStructuresWithContactEmail).toHaveBeenCalledWith(
      "Contact@Coallia.org"
    );
  });

  it("écarte une structure dont le contact n'est plus dans la version affichée", async () => {
    mockFindStructuresWithContactEmail.mockResolvedValueOnce([
      {
        id: 2,
        structureVersions: [
          buildVersion(20, null, [200]),
          buildVersion(21, "2026-01-01T00:00:00.000Z", []),
        ],
      },
    ]);

    expect(await getContactStructureIds("contact@coallia.org")).toEqual([]);
  });
});
