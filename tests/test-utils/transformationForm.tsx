import { render } from "@testing-library/react";
import { ReactNode, useEffect } from "react";
import { vi } from "vitest";

import {
  TransformationClientProvider,
  useOptionalTransformationContext,
} from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { FetchStateProvider } from "@/app/context/FetchStateContext";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { toJsonResponse } from "./http.mock";

const ShowIncompleteStepsSetter = () => {
  const { setShouldShowIncompleteSteps } = useOptionalTransformationContext();
  useEffect(() => {
    setShouldShowIncompleteSteps(true);
  }, [setShouldShowIncompleteSteps]);
  return null;
};

export const renderTransformationForm = (
  transformation: TransformationApiRead,
  form: ReactNode,
  { showIncompleteSteps = false }: { showIncompleteSteps?: boolean } = {}
) =>
  render(
    <FetchStateProvider>
      <TransformationClientProvider transformation={transformation}>
        {showIncompleteSteps && <ShowIncompleteStepsSetter />}
        {form}
      </TransformationClientProvider>
    </FetchStateProvider>
  );

export const mockTransformationFetch = (
  transformationId: number,
  { failSave = false }: { failSave?: boolean } = {}
) => {
  const transformationUrl = `/api/transformations/${transformationId}`;
  const fetchMock = vi.fn();
  fetchMock.mockImplementation((input, init) => {
    const url = String(input);
    if (url === transformationUrl && init?.method === "PUT") {
      return Promise.resolve(
        (failSave
          ? toJsonResponse(500, { error: "boom" })
          : toJsonResponse(200, { transformationId })) as Response
      );
    }
    if (url === transformationUrl) {
      return Promise.resolve(
        toJsonResponse(200, {
          id: transformationId,
          structureVersionTransformations: [],
        }) as Response
      );
    }
    return Promise.resolve(toJsonResponse(200, []) as Response);
  });
  global.fetch = fetchMock as typeof global.fetch;
  return fetchMock;
};

type FetchMock = ReturnType<typeof mockTransformationFetch>;

export const getSavedTransformation = (
  fetchMock: FetchMock,
  transformationId: number
) => {
  const putCall = fetchMock.mock.calls.find(
    ([url, init]) =>
      String(url) === `/api/transformations/${transformationId}` &&
      (init as RequestInit | undefined)?.method === "PUT"
  );
  return JSON.parse((putCall?.[1] as RequestInit).body as string);
};

export const getSavedStructureVersionTransformation = (
  fetchMock: FetchMock,
  transformationId: number
) =>
  getSavedTransformation(fetchMock, transformationId)
    .structureVersionTransformations[0];

export const getSavedFormStepStatus = (
  fetchMock: FetchMock,
  transformationId: number,
  slug: string
): string =>
  getSavedStructureVersionTransformation(
    fetchMock,
    transformationId
  ).form.formSteps.find(
    (formStep: { stepDefinition: { slug: string } }) =>
      formStep.stepDefinition.slug === slug
  ).status;
