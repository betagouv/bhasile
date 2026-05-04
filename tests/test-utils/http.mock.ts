import { vi } from "vitest";

export const mockFetch = vi.fn();

export const installMockFetch = () => {
  global.fetch = mockFetch;
};

export const toJsonResponse = (status: number, payload: unknown) => ({
  status,
  ok: status < 400,
  json: () => Promise.resolve(payload),
});

type StructureLike = { id: number };

export const mockStructurePageFetch = (structure: StructureLike) => {
  const mockedFetch = vi.mocked(global.fetch);

  mockedFetch.mockImplementation((input, init) => {
    if (input === `/api/dna-codes?structureId=${structure.id}`) {
      return Promise.resolve(
        toJsonResponse(200, [{ code: "C0001" }]) as Response
      );
    }

    if (input === "/api/structures" && init?.method === "PUT") {
      return Promise.resolve(toJsonResponse(201, "OK") as Response);
    }

    if (typeof input === "string" && input.startsWith("/api/files/")) {
      return Promise.resolve(
        toJsonResponse(200, {
          key: input.replace("/api/files/", ""),
          contentType: "application/pdf",
          fileName: "mock.pdf",
          path: "mock/path.pdf",
          id: 1,
        }) as Response
      );
    }

    if (input === `/api/structures/${structure.id}`) {
      return Promise.resolve(toJsonResponse(200, structure) as Response);
    }

    return Promise.reject(new Error(`Unexpected fetch call: ${String(input)}`));
  });

  return mockedFetch;
};
