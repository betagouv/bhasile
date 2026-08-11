import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import { AnomalieMessage } from "@/app/components/forms/AnomalieMessage";
import FormWrapper from "@/app/components/forms/FormWrapper";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { StructureProvider } from "@/contexts/StructureContext";
import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import { StructureApiRead } from "@/schemas/api/structure.schema";

const CODE = "PLACES_LABELLISEES_GT_AUTORISEES";
const ANNEE = 2024;

const schema = z.object({
  structureTypologies: z.array(
    z.object({
      year: z.number(),
      placesAutorisees: z.number().nullable(),
      lgbt: z.number().nullable(),
      pmr: z.number().nullable(),
      fvvTeh: z.number().nullable(),
    })
  ),
});

const typologie = (lgbt: number) => ({
  year: ANNEE,
  placesAutorisees: 10,
  lgbt,
  pmr: 0,
  fvvTeh: 0,
});

const makeStructure = (
  overrides: Partial<StructureApiRead> = {}
): StructureApiRead =>
  ({
    type: "CADA",
    departementAdministratif: "50",
    creationDate: "2020-01-01T12:00:00.000Z",
    date303: null,
    placesAutorisees: 10,
    lgbt: true,
    fvvTeh: false,
    debutConvention: null,
    finConvention: null,
    debutPeriodeAutorisation: null,
    finPeriodeAutorisation: null,
    structureTypologies: [],
    actesAdministratifs: [],
    adresses: [],
    budgets: [],
    indicateursFinanciers: [],
    anomalies: [],
    ...overrides,
  }) as unknown as StructureApiRead;

const renderForm = (structure: StructureApiRead, lgbt: number) =>
  render(
    <StructureProvider entity={structure}>
      <FormWrapper
        schema={schema}
        showSubmitButton={false}
        defaultValues={{ structureTypologies: [typologie(lgbt)] }}
      >
        {({ control }) => (
          <>
            <InputWithValidation
              name="structureTypologies.0.lgbt"
              id="structureTypologies.0.lgbt"
              control={control}
              type="number"
              label="Places LGBT"
              describedById="anomalies-test"
              variant="simple"
            />
            <AnomalieMessage id="anomalies-test" fields={["lgbt"]} />
          </>
        )}
      </FormWrapper>
    </StructureProvider>
  );

describe("marquage des anomalies dans un formulaire", () => {
  it("affiche l'anomalie détectée dès le montage", async () => {
    renderForm(makeStructure({ structureTypologies: [typologie(99)] }), 99);

    expect(
      await screen.findByText(
        `${ANOMALIE_DEFINITIONS[CODE].label} (exercice ${ANNEE})`
      )
    ).toBeInTheDocument();
  });

  it("n'affiche rien quand les données sont cohérentes", async () => {
    renderForm(makeStructure({ structureTypologies: [typologie(2)] }), 2);

    await screen.findByLabelText("Places LGBT");
    expect(
      screen.queryByText(ANOMALIE_DEFINITIONS[CODE].label, { exact: false })
    ).not.toBeInTheDocument();
  });

  it("fait disparaître le marquage quand l'agent corrige à la sortie du champ", async () => {
    const user = userEvent.setup();
    renderForm(makeStructure({ structureTypologies: [typologie(99)] }), 99);

    const input = await screen.findByLabelText("Places LGBT");
    expect(
      screen.getByText(
        `${ANOMALIE_DEFINITIONS[CODE].label} (exercice ${ANNEE})`
      )
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "2");
    await user.tab();

    expect(
      screen.queryByText(ANOMALIE_DEFINITIONS[CODE].label, { exact: false })
    ).not.toBeInTheDocument();
  });

  it("tait une anomalie que l'agent a déclarée normale", async () => {
    renderForm(
      makeStructure({
        structureTypologies: [typologie(99)],
        anomalies: [{ code: CODE, year: ANNEE, targetId: 0 }],
      }),
      99
    );

    await screen.findByLabelText("Places LGBT");
    expect(
      screen.queryByText(ANOMALIE_DEFINITIONS[CODE].label, { exact: false })
    ).not.toBeInTheDocument();
  });
});
