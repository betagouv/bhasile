import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
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
import { TypePlaceCell } from "@/app/components/forms/typePlace/TypePlaceCell";
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

const typologie = (lgbt: number, year: number = ANNEE) => ({
  year,
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
              variant="simple"
            />
            <AnomalieMessage fields={["lgbt"]} />
          </>
        )}
      </FormWrapper>
    </StructureProvider>
  );

// Comme en production : la cellule tient son control du contexte du formulaire.
const TypePlaceCellHarness = () => {
  const { control } = useFormContext();

  return (
    <table>
      <tbody>
        <tr>
          <TypePlaceCell control={control} field="lgbt" year={ANNEE} index={0} />
        </tr>
      </tbody>
    </table>
  );
};

const renderTypePlaceCell = (structure: StructureApiRead, lgbt: number) =>
  render(
    <StructureProvider entity={structure}>
      <FormWrapper
        schema={schema}
        showSubmitButton={false}
        defaultValues={{ structureTypologies: [typologie(lgbt)] }}
      >
        <TypePlaceCellHarness />
      </FormWrapper>
    </StructureProvider>
  );

const CODE_ACTE = "CONVENTION_AUTORISEE_DUREE_NOT_5Y";

const renderActeMessages = () =>
  render(
    <StructureProvider
      entity={makeStructure({
        actesAdministratifs: [
          {
            id: 7,
            category: "CONVENTION",
            startDate: "2020-01-01T12:00:00.000Z",
            endDate: "2023-01-01T12:00:00.000Z",
          },
        ],
      } as unknown as Partial<StructureApiRead>)}
    >
      <FormWrapper schema={z.object({})} showSubmitButton={false}>
        {() => (
          <>
            <AnomalieMessage fields={["startDate", "endDate"]} targetIds={[7]} />
            <AnomalieMessage fields={["startDate", "endDate"]} targetIds={[8]} />
            <AnomalieMessage fields={["startDate", "endDate"]} targetIds={[]} />
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

  it("n'affiche l'anomalie d'un acte que sous la catégorie visée", async () => {
    renderActeMessages();

    // Trois messages rendus, un seul rempli : celui de la catégorie visée.
    // Le troisième cible une liste vide — un acte pas encore enregistré.
    const messages = await screen.findAllByRole("status");
    const filledMessages = messages.filter(
      (message) => message.textContent !== ""
    );

    expect(messages).toHaveLength(3);
    expect(filledMessages).toHaveLength(1);
    expect(filledMessages[0]).toHaveTextContent(
      ANOMALIE_DEFINITIONS[CODE_ACTE].label
    );
  });

  it("décrit l'anomalie au niveau de la cellule marquée", async () => {
    renderTypePlaceCell(
      makeStructure({ structureTypologies: [typologie(99)] }),
      99
    );

    const anomalieId = "structureTypologies.0.lgbt-anomalie";
    const input = await screen.findByRole("textbox");

    expect(input).toHaveAttribute("aria-describedby", anomalieId);
    expect(document.getElementById(anomalieId)).toHaveTextContent(
      ANOMALIE_DEFINITIONS[CODE].label
    );
  });

  it("fusionne une même anomalie sur plusieurs exercices", async () => {
    const typologies = [typologie(99, 2023), typologie(99, ANNEE)];
    render(
      <StructureProvider
        entity={makeStructure({ structureTypologies: typologies })}
      >
        <FormWrapper
          schema={schema}
          showSubmitButton={false}
          defaultValues={{ structureTypologies: typologies }}
        >
          <AnomalieMessage fields={["lgbt"]} />
        </FormWrapper>
      </StructureProvider>
    );

    expect(
      await screen.findByText(
        `${ANOMALIE_DEFINITIONS[CODE].label} (exercices 2023, ${ANNEE})`
      )
    ).toBeInTheDocument();
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
