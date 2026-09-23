import { render } from "@testing-library/react";
import type maplibregl from "maplibre-gl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapContext } from "@/app/components/map/MapContext";
import { StructuresLayer } from "@/app/components/map/StructuresLayer";
import { StructureMapPoint } from "@/types/structure-list.type";

const mockUnbindInteractions = vi.fn();
const mockBindStructuresInteractions = vi.fn<
  (...args: unknown[]) => () => void
>(() => mockUnbindInteractions);
const mockAddStructuresSource = vi.fn();
const mockAddStructuresImages = vi.fn();
const mockAddStructuresLayers = vi.fn();
const mockRemoveStructuresLayers = vi.fn();

vi.mock("@/app/components/map/structuresInteractions", () => ({
  bindStructuresInteractions: (...args: unknown[]) =>
    mockBindStructuresInteractions(...args),
}));

vi.mock("@/app/components/map/structuresStyle", () => ({
  STRUCTURES_SOURCE_ID: "structures",
  addStructuresSource: (...args: unknown[]) => mockAddStructuresSource(...args),
  addStructuresImages: (...args: unknown[]) => mockAddStructuresImages(...args),
  addStructuresLayers: (...args: unknown[]) => mockAddStructuresLayers(...args),
  removeStructuresLayers: (...args: unknown[]) =>
    mockRemoveStructuresLayers(...args),
}));

const POINTS: StructureMapPoint[] = [
  { id: 7, latitude: "49.1138", longitude: "-1.0801" },
];

// Carte factice : juste ce que la couche utilise, avec un vrai événement « remove ».
const createFakeMap = () => {
  const removeListeners = new Set<() => void>();
  const setData = vi.fn();
  const fakeMap = {
    once: (_type: string, listener: () => void) => {
      removeListeners.add(listener);
    },
    off: (_type: string, listener: () => void) => {
      removeListeners.delete(listener);
    },
    getSource: vi.fn(() => ({ setData })),
    remove: () => {
      for (const listener of removeListeners) {
        listener();
      }
      removeListeners.clear();
    },
  };
  return {
    fakeMap,
    map: fakeMap as unknown as maplibregl.Map,
    setData,
  };
};

const renderLayer = (map: maplibregl.Map) =>
  render(
    <MapContext.Provider value={map}>
      <StructuresLayer points={POINTS} />
    </MapContext.Provider>
  );

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("StructuresLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddStructuresImages.mockResolvedValue(undefined);
  });

  it("pose les points dans la source, puis les couches et les interactions une fois les images chargées", async () => {
    const { map, setData } = createFakeMap();

    renderLayer(map);
    await flushPromises();

    expect(mockAddStructuresSource).toHaveBeenCalledWith(map);
    expect(setData).toHaveBeenCalledWith({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { id: "7" },
          geometry: { type: "Point", coordinates: [-1.0801, 49.1138] },
        },
      ],
    });
    expect(mockAddStructuresLayers).toHaveBeenCalledWith(map);
    expect(mockBindStructuresInteractions).toHaveBeenCalledTimes(1);
  });

  it("retire interactions puis couches quand la couche est démontée sur une carte toujours vivante", async () => {
    const { map } = createFakeMap();

    const { unmount } = renderLayer(map);
    await flushPromises();
    unmount();

    expect(mockUnbindInteractions).toHaveBeenCalledTimes(1);
    expect(mockRemoveStructuresLayers).toHaveBeenCalledWith(map);
    expect(mockUnbindInteractions.mock.invocationCallOrder[0]).toBeLessThan(
      mockRemoveStructuresLayers.mock.invocationCallOrder[0]
    );
  });

  it("ne touche plus à une carte déjà détruite", async () => {
    const { fakeMap, map } = createFakeMap();

    const { unmount } = renderLayer(map);
    await flushPromises();
    fakeMap.remove();
    unmount();

    expect(mockUnbindInteractions).not.toHaveBeenCalled();
    expect(mockRemoveStructuresLayers).not.toHaveBeenCalled();
  });

  it("n'ajoute pas les couches si elle est démontée avant la fin du chargement des images", async () => {
    const { map } = createFakeMap();
    let resolveImages: () => void = () => {};
    mockAddStructuresImages.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveImages = resolve;
      })
    );

    const { unmount } = renderLayer(map);
    unmount();
    resolveImages();
    await flushPromises();

    expect(mockAddStructuresLayers).not.toHaveBeenCalled();
    expect(mockBindStructuresInteractions).not.toHaveBeenCalled();
    expect(mockRemoveStructuresLayers).toHaveBeenCalledWith(map);
  });

  it("ignore une source introuvable plutôt que de planter", async () => {
    const { fakeMap, map } = createFakeMap();
    fakeMap.getSource.mockImplementation(() => {
      throw new Error("Style is not done loading");
    });

    expect(() => renderLayer(map)).not.toThrow();
    await flushPromises();
  });
});
