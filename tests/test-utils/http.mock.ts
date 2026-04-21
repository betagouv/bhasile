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
