import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import {
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlacesEtHebergementForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/PlacesEtHebergementForm";
import { CURRENT_YEAR } from "@/constants";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";
import { PublicType } from "@/types/structure.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const TRANSFORMATION_ID = 12;
const STRUCTURE_VERSION_TRANSFORMATION_ID = 7;
const ORIGINAL_PLACES = 47;

const mockUseParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => mockUseParams(),
  usePathname: () =>
    "/structures/transformation/12/extension/7/places-et-hebergement",
}));

vi.mock("@/app/components/forms/hebergement/FieldSetTypeBati", () => ({
  FieldSetTypeBati: () => null,
}));
vi.mock("@/app/components/forms/hebergement/FieldSetHebergement", () => ({
  FieldSetHebergement: () => null,
}));

let fetchMock: ReturnType<typeof mockTransformationFetch>;

const buildStructureVersion = () =>
  ({
    id: 999,
    public: PublicType.TOUT_PUBLIC,
    typeBati: Repartition.COLLECTIF,
    adresses: [
      {
        id: 1,
        adresse: "12 rue des Lilas",
        adresseComplete: "12 rue des Lilas 75011 Paris",
        codePostal: "75011",
        commune: "Paris",
        repartition: Repartition.COLLECTIF,
        adresseTypologies: [
          {
            year: CURRENT_YEAR,
            placesAutorisees: 10,
            qpv: false,
            logementSocial: false,
          },
        ],
      },
    ],
    structureTypologies: [
      {
        year: CURRENT_YEAR,
        placesAutorisees: ORIGINAL_PLACES,
        pmr: 0,
        lgbt: 0,
        fvvTeh: 0,
      },
    ],
  }) as unknown as NonNullable<
    StructureVersionTransformationApiRead["structureVersion"]
  >;

const renderForm = (structureType: StructureVersionTransformationType) => {
  const structureVersionTransformation = createStructureVersionTransformation({
    id: STRUCTURE_VERSION_TRANSFORMATION_ID,
    type: structureType,
    structureVersion: buildStructureVersion(),
  });
  const transformation = createTransformation({
    id: TRANSFORMATION_ID,
    type:
      structureType === StructureVersionTransformationType.EXTENSION
        ? TransformationType.EXTENSION_EX_NIHILO
        : TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
    structureVersionTransformations: [structureVersionTransformation],
  });

  mockUseParams.mockReturnValue({
    transformationId: String(TRANSFORMATION_ID),
    transformationStructureType: structureType,
    transformationStructureId: String(STRUCTURE_VERSION_TRANSFORMATION_ID),
    transformationStructureStep:
      StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
  });

  const formKind =
    structureType === StructureVersionTransformationType.EXTENSION
      ? FormKind.EXTENSION
      : FormKind.CONTRACTION;

  renderTransformationForm(
    transformation,
    <PlacesEtHebergementForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
      formKind={formKind}
      originalPlaces={ORIGINAL_PLACES}
    />
  );
};

const setPlaces = async (value: number) => {
  const placesInput = screen.getByLabelText(
    "Nombre total de places autorisées"
  );
  await userEvent.clear(placesInput);
  await userEvent.type(placesInput, String(value));
};

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "Étape suivante" }));

const getPutPayloadPlaces = () =>
  getSavedStructureVersionTransformation(fetchMock, TRANSFORMATION_ID)
    .structureVersion.structureTypologies[0].placesAutorisees;

describe("PlacesEtHebergementForm — contrainte de variation des places", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
  });

  it("signale l'incohérence d'une extension sans ajout de place sans bloquer la navigation", async () => {
    renderForm(StructureVersionTransformationType.EXTENSION);

    await setPlaces(ORIGINAL_PLACES);
    await submit();

    // Le submit n'est pas bloqué : la sauvegarde part malgré la contrainte non respectée
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(getPutPayloadPlaces()).toBe(ORIGINAL_PLACES);
    // L'absence d'ajout de place est signalée inline, sans bloquer
    expect(
      await screen.findByText(
        `Le nombre de places autorisées doit être supérieur au nombre de places précédent (${ORIGINAL_PLACES}).`
      )
    ).toBeInTheDocument();
  });

  it("laisse passer une extension qui ajoute des places", async () => {
    renderForm(StructureVersionTransformationType.EXTENSION);

    await setPlaces(ORIGINAL_PLACES + 3);
    await submit();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(getPutPayloadPlaces()).toBe(ORIGINAL_PLACES + 3);
  });

  it("signale l'incohérence d'une contraction sans retrait de place sans bloquer la navigation", async () => {
    renderForm(StructureVersionTransformationType.CONTRACTION);

    await setPlaces(ORIGINAL_PLACES);
    await submit();

    // Le submit n'est pas bloqué : la sauvegarde part malgré la contrainte non respectée
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(getPutPayloadPlaces()).toBe(ORIGINAL_PLACES);
    // L'absence de retrait de place est signalée inline, sans bloquer
    expect(
      await screen.findByText(
        `Le nombre de places autorisées doit être inférieur au nombre de places précédent (${ORIGINAL_PLACES}).`
      )
    ).toBeInTheDocument();
  });

  it("laisse passer une contraction qui retire des places", async () => {
    renderForm(StructureVersionTransformationType.CONTRACTION);

    await setPlaces(ORIGINAL_PLACES - 7);
    await submit();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(getPutPayloadPlaces()).toBe(ORIGINAL_PLACES - 7);
  });

  it("sauvegarde même quand tous les champs sont vides (null venant de la BDD)", async () => {
    // GIVEN a version whose public / typeBati / places columns are still null
    const structureVersionTransformation = createStructureVersionTransformation({
      id: STRUCTURE_VERSION_TRANSFORMATION_ID,
      type: StructureVersionTransformationType.EXTENSION,
      structureVersion: {
        id: 999,
        public: null,
        typeBati: null,
        adresses: [],
        structureTypologies: [
          {
            year: CURRENT_YEAR,
            placesAutorisees: null,
            pmr: null,
            lgbt: null,
            fvvTeh: null,
          },
        ],
      } as unknown as NonNullable<
        StructureVersionTransformationApiRead["structureVersion"]
      >,
    });
    const transformation = createTransformation({
      id: TRANSFORMATION_ID,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [structureVersionTransformation],
    });

    mockUseParams.mockReturnValue({
      transformationId: String(TRANSFORMATION_ID),
      transformationStructureType: StructureVersionTransformationType.EXTENSION,
      transformationStructureId: String(STRUCTURE_VERSION_TRANSFORMATION_ID),
      transformationStructureStep:
        StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
    });

    renderTransformationForm(
      transformation,
      <PlacesEtHebergementForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={FormKind.EXTENSION}
        originalPlaces={ORIGINAL_PLACES}
      />
    );

    // WHEN submitting without filling anything
    await submit();

    // THEN the draft save is not blocked: the PUT still leaves
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
  });
});
