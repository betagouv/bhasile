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

// Le controller est générique sur le schéma : un schéma minimal suffit à tester sa
// logique propre (enregistrer le saver, déclencher la validation). Les vrais schémas
// de formulaire sont exercés par les tests d'intégration des forms.
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

// Reproduit la production : le resolver du FormWrapper est le schéma STRICT dès que
// shouldShowIncompleteSteps est true (seul cas où les erreurs doivent apparaître),
// tandis que le schéma draft du controller ne pilote que le saver.
const ControllerTestForm = ({
  defaultValues,
}: {
  defaultValues: { nom: string };
}) => {
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

  it("enregistre un saver au montage", () => {
    render(<ControllerTestForm defaultValues={{ nom: "" }} />);

    expect(mockRegisterSaver).toHaveBeenCalledWith(expect.any(Function));
  });

  it("ne déclenche pas la validation tant que shouldShowIncompleteSteps est false", async () => {
    render(<ControllerTestForm defaultValues={{ nom: "" }} />);

    // give effects a chance to run
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId("error-nom")).toHaveTextContent("");
  });

  it("déclenche la validation au montage quand shouldShowIncompleteSteps est true, faisant apparaître les erreurs strictes", async () => {
    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: true,
    });

    render(<ControllerTestForm defaultValues={{ nom: "" }} />);

    await waitFor(() =>
      expect(screen.getByTestId("error-nom")).toHaveTextContent(
        "Le nom est requis"
      )
    );
  });

  it("n'affiche aucune erreur quand le formulaire satisfait déjà le schéma strict", async () => {
    mockUseOptionalTransformationContext.mockReturnValue({
      registerSaver: mockRegisterSaver,
      shouldShowIncompleteSteps: true,
    });

    render(<ControllerTestForm defaultValues={{ nom: "Les Coquelicots" }} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId("error-nom")).toHaveTextContent("");
  });
});
