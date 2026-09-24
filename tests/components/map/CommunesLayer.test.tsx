import { render } from "@testing-library/react";
import type maplibregl from "maplibre-gl";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunesLayer } from "@/app/components/map/CommunesLayer";
import { MapContext } from "@/app/components/map/MapContext";
import { CommuneMapPoint } from "@/types/structure-list.type";

const mockRenderPopup = vi.fn<(content: ReactNode) => void>();
const mockAddPopupTo = vi.fn();
const mockRemovePopup = vi.fn();
const mockRemoveCommunesLayer = vi.fn();

vi.mock("@/app/components/map/mapPopup", () => ({
  getOrCreatePopup: ({ popupRef }: { popupRef: { current: unknown } }) => {
    const popup = {
      setLngLat: () => ({ addTo: mockAddPopupTo }),
      remove: mockRemovePopup,
    };
    popupRef.current = popup;
    return { popup, root: { render: mockRenderPopup } };
  },
  closePopup: vi.fn(),
}));
vi.mock("@/app/components/map/structuresStyle", () => ({
  addClusterCircleImages: vi.fn(),
}));
vi.mock("@/app/components/map/communesStyle", () => ({
  COMMUNES_SOURCE_ID: "communes",
  COMMUNES_LAYER_ID: "communes-places",
  addCommunesSource: vi.fn(),
  addCommunesLayer: vi.fn(),
  removeCommunesLayer: (...args: unknown[]) => mockRemoveCommunesLayer(...args),
}));

const SAINT_LO: CommuneMapPoint = {
  key: "49.1138|-1.0801",
  latitude: 49.1138,
  longitude: -1.0801,
  nom: "Saint-Lô",
  places: 4,
  structures: [],
};

type Handler = (event: unknown) => void;

// Carte factice : enregistre les écouteurs pour pouvoir simuler un clic et l'événement « remove ».
const createFakeMap = () => {
  const handlers = new Map<string, Set<Handler>>();
  const setData = vi.fn();
  const getClusterExpansionZoom = vi.fn<() => Promise<number>>();
  const easeTo = vi.fn();
  const getHandlerKey = (type: string, layerId?: unknown) =>
    typeof layerId === "string" ? `${type}:${layerId}` : type;
  const fakeMap = {
    on: (type: string, layerOrHandler: unknown, handler?: Handler) => {
      const key = getHandlerKey(type, layerOrHandler);
      const listener = (handler ?? layerOrHandler) as Handler;
      handlers.set(key, new Set([...(handlers.get(key) ?? []), listener]));
    },
    once: (type: string, handler: Handler) => fakeMap.on(type, handler),
    off: (type: string, layerOrHandler: unknown, handler?: Handler) => {
      handlers
        .get(getHandlerKey(type, layerOrHandler))
        ?.delete((handler ?? layerOrHandler) as Handler);
    },
    fire: (key: string, event: unknown = {}) => {
      for (const handler of handlers.get(key) ?? []) {
        handler(event);
      }
    },
    listenerCount: () =>
      [...handlers.values()].reduce((total, set) => total + set.size, 0),
    getSource: () => ({ setData, getClusterExpansionZoom }),
    getCanvas: () => ({ style: {} }),
    easeTo,
  };
  return {
    fakeMap,
    map: fakeMap as unknown as maplibregl.Map,
    setData,
    getClusterExpansionZoom,
    easeTo,
  };
};

const renderLayer = (map: maplibregl.Map, communes = [SAINT_LO]) =>
  render(
    <MapContext.Provider value={map}>
      <CommunesLayer communes={communes} />
    </MapContext.Provider>
  );

describe("CommunesLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pose une pastille par commune portant son total de places", () => {
    const { map, setData } = createFakeMap();

    renderLayer(map);

    expect(setData).toHaveBeenCalledWith({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { key: "49.1138|-1.0801", places: 4 },
          geometry: { type: "Point", coordinates: [-1.0801, 49.1138] },
        },
      ],
    });
  });

  it("ouvre la popup de la commune cliquée", () => {
    const { fakeMap, map } = createFakeMap();
    renderLayer(map);

    fakeMap.fire("click:communes-places", {
      features: [
        {
          properties: { key: "49.1138|-1.0801", places: 4 },
          geometry: { type: "Point", coordinates: [-1.0801, 49.1138] },
        },
      ],
    });

    expect(mockRenderPopup).toHaveBeenCalledTimes(1);
    expect(mockAddPopupTo).toHaveBeenCalledWith(map);
  });

  it("ferme la popup ouverte quand les communes changent", () => {
    const { fakeMap, map } = createFakeMap();
    const { rerender } = renderLayer(map);
    fakeMap.fire("click:communes-places", {
      features: [
        {
          properties: { key: SAINT_LO.key, places: 4 },
          geometry: { type: "Point", coordinates: [-1.0801, 49.1138] },
        },
      ],
    });

    rerender(
      <MapContext.Provider value={map}>
        <CommunesLayer communes={[{ ...SAINT_LO, places: 2 }]} />
      </MapContext.Provider>
    );

    expect(mockRemovePopup).toHaveBeenCalled();
  });

  const clusterClick = {
    features: [
      {
        properties: { cluster: true, cluster_id: 1, places: 12 },
        geometry: { type: "Point", coordinates: [2.347, 48.859] },
      },
    ],
  };

  it("ne zoome pas si la couche a disparu avant la réponse de la source", async () => {
    const { fakeMap, map, getClusterExpansionZoom, easeTo } = createFakeMap();
    let resolveZoom: (zoom: number) => void = () => {};
    getClusterExpansionZoom.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveZoom = resolve;
      })
    );

    const { unmount } = renderLayer(map);
    fakeMap.fire("click:communes-places", clusterClick);
    unmount();
    resolveZoom(9);
    await Promise.resolve();

    expect(easeTo).not.toHaveBeenCalled();
  });

  // Vitest fait échouer le run sur un rejet non géré : ce test échouerait sans le catch.
  it("absorbe l'échec de la source au zoom sur un regroupement", async () => {
    const { fakeMap, map, getClusterExpansionZoom, easeTo } = createFakeMap();
    getClusterExpansionZoom.mockRejectedValueOnce(new Error("Source removed"));

    renderLayer(map);
    fakeMap.fire("click:communes-places", clusterClick);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(easeTo).not.toHaveBeenCalled();
  });

  it("retire ses écouteurs et sa couche quand elle est démontée sur une carte toujours vivante", () => {
    const { fakeMap, map } = createFakeMap();

    const { unmount } = renderLayer(map);
    unmount();

    expect(fakeMap.listenerCount()).toBe(0);
    expect(mockRemoveCommunesLayer).toHaveBeenCalledWith(map);
  });

  it("ne touche plus à une carte déjà détruite", () => {
    const { fakeMap, map } = createFakeMap();

    const { unmount } = renderLayer(map);
    fakeMap.fire("remove");
    unmount();

    expect(mockRemoveCommunesLayer).not.toHaveBeenCalled();
  });
});
