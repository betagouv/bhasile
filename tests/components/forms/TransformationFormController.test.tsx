import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { TransformationFormController } from "@/app/components/forms/TransformationFormController";

const mockRegisterSaver = vi.fn();
const mockUseOptionalTransformationContext = vi.fn();

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useOptionalTransformationContext: () =>
      mockUseOptionalTransformationContext(),
  })
);

const draftSchema = z.object({ nom: z.string().optional() });
const strictSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
});

const FieldErrorProbe = ({ name }: { name: string }) => {
  const { errors } = useFormState();
  return (
    <span data-testid={`error-${name}`}>
      {(errors[name]?.message as string) ?? ""}
    </span>
  );
};

const Harness = ({ defaultValues }: { defaultValues: { nom: string } }) => {
  const methods = useForm({
    resolver: zodResolver(strictSchema),
    defaultValues,
  });
  return (
    <FormProvider {...methods}>
      <TransformationFormController schema={draftSchema} onSave={vi.fn()} />
      <FieldErrorProbe name="nom" />
    </FormProvider>
  );
};

describe("TransformationFormController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("registers a saver on mount", () => {
    render(<Harness defaultValues={{ nom: "" }} />);

    expect(mockRegisterSaver).toHaveBeenCalledWith(expect.any(Function));
  });

  it("does not trigger validation while shouldShowIncompleteSteps is false", async () => {
    render(<Harness defaultValues={{ nom: "" }} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId("error-nom")).toHaveTextContent("");
  });

  it("triggers validation on mount when shouldShowIncompleteSteps is true, surfacing the strict errors", async () => {
    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: true,
    });

    render(<Harness defaultValues={{ nom: "" }} />);

    await waitFor(() =>
      expect(screen.getByTestId("error-nom")).toHaveTextContent(
        "Le nom est requis"
      )
    );
  });

  it("triggers validation when shouldShowIncompleteSteps flips from false to true", async () => {
    const { rerender } = render(<Harness defaultValues={{ nom: "" }} />);
    expect(screen.getByTestId("error-nom")).toHaveTextContent("");

    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: true,
    });
    rerender(<Harness defaultValues={{ nom: "" }} />);

    await waitFor(() =>
      expect(screen.getByTestId("error-nom")).toHaveTextContent(
        "Le nom est requis"
      )
    );
  });

  it("surfaces no error when the form already satisfies the strict schema", async () => {
    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: true,
    });

    render(<Harness defaultValues={{ nom: "Les Coquelicots" }} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId("error-nom")).toHaveTextContent("");
  });
});
