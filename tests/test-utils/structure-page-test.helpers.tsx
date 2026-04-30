import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { vi } from "vitest";

import { StructureClientProvider } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { FetchStateProvider } from "@/app/context/FetchStateContext";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

export type FinalisationStepValidationPayload = {
  id: number;
  forms: Array<{
    formSteps: Array<{
      stepDefinition: { label: string };
      status: StepStatus;
    }>;
  }>;
};

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
  mockedFetch.mock.calls
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

export const getLatestPutStructuresPayloadMatching = <T,>(
  mockedFetch: { mock: { calls: unknown[][] } },
  predicate: (payload: T) => boolean
) => {
  const putCalls = mockedFetch.mock.calls
    .reverse()
    .filter(
      (call) =>
        call[0] === "/api/structures" &&
        (call[1] as RequestInit | undefined)?.method === "PUT"
    );

  for (const call of putCalls) {
    const payload = JSON.parse((call[1] as RequestInit).body as string) as T;
    if (predicate(payload)) {
      return payload;
    }
  }

  throw new Error("Expected one matching PUT call to /api/structures");
};

export const clickButtonByName = async (name: string) => {
  await waitFor(() => {
    screen.getByRole("button", { name });
  });
  await userEvent.click(screen.getByRole("button", { name }));
};

export const flushAutoSaveDebounce = async (delayMs = 500) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(delayMs);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
  });
};

export const expectFinalisationStepValidation = (
  payload: FinalisationStepValidationPayload,
  expected: {
    structureId: number;
    stepLabel: string;
    nextRoute?: string;
    mockRouterPush: (...args: unknown[]) => unknown;
  }
) => {
  expect(payload.id).toBe(expected.structureId);
  expect(payload.forms[0].formSteps).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        stepDefinition: expect.objectContaining({ label: expected.stepLabel }),
        status: StepStatus.VALIDE,
      }),
    ])
  );

  if (expected.nextRoute) {
    expect(expected.mockRouterPush).toHaveBeenCalledWith(expected.nextRoute);
  }
};
