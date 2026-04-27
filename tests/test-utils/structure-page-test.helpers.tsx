import { render } from "@testing-library/react";
import { ReactElement } from "react";

import { StructureClientProvider } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { FetchStateProvider } from "@/app/context/FetchStateContext";
import { StructureApiRead } from "@/schemas/api/structure.schema";

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

export const renderWithStructurePageProviders = (
  structure: StructureApiRead,
  page: ReactElement
) =>
  render(
    <FetchStateProvider>
      <StructureClientProvider structure={structure}>
        {page}
      </StructureClientProvider>
    </FetchStateProvider>
  );

export const findPutStructuresCall = (mockedFetch: {
  mock: { calls: unknown[][] };
}) =>
  [...mockedFetch.mock.calls]
    .reverse()
    .find(
      (call) =>
        call[0] === "/api/structures" &&
        (call[1] as RequestInit | undefined)?.method === "PUT"
    );

export const getPutStructuresPayload = <T,>(mockedFetch: {
  mock: { calls: unknown[][] };
}) => {
  const putCall = findPutStructuresCall(mockedFetch);
  if (!putCall) {
    throw new Error("Expected one PUT call to /api/structures");
  }

  return JSON.parse((putCall[1] as RequestInit).body as string) as T;
};
