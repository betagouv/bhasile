import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const addStructuresMarkerImage = vi.fn();
const addStructuresLayers = vi.fn();
const addStructuresSource = vi.fn();
const bindStructuresInteractions = vi.fn(() => () => {});
const addOverlay = vi.fn();

let loadHandler: (() => void | Promise<void>) | null = null;

vi.mock("maplibre-gl", () => {
  class Map {
    addControl() {}
    on(event: string, handler: () => void | Promise<void>) {
      if (event === "load") {
        loadHandler = handler;
      }
    }
    once() {}
    remove() {}
    resize() {}
    getSource() {
      return { setData: vi.fn() };
    }
  }

  class NavigationControl {}

  return { default: { Map, NavigationControl } };
});

vi.mock("carte-facile", () => ({
  addOverlay,
  mapStyles: { desaturated: {} },
  Overlay: { administrativeBoundaries: "administrativeBoundaries" },
}));

vi.mock("@/constants", () => ({
  DEFAULT_MAP_ZOOM: 5,
  FRANCE_CENTER: [48, 2],
  FRANCE_MAX_BOUNDS: [
    [41, -5],
    [51, 9],
  ],
}));

vi.mock("@/app/components/map/structuresStyle", () => ({
  STRUCTURES_SOURCE_ID: "structures",
  addStructuresSource,
  addStructuresMarkerImage: addStructuresMarkerImage,
  addStructuresLayers,
}));

vi.mock("@/app/components/map/structuresInteractions", () => ({
  bindStructuresInteractions,
}));

describe("Map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadHandler = null;
    (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver =
      class ResizeObserver {
        observe() {}
        disconnect() {}
      };
  });

  it("should await marker image before adding layers", async () => {
    // GIVEN
    const markerDeferred = createDeferred<void>();
    addStructuresMarkerImage.mockReturnValueOnce(markerDeferred.promise);

    const { Map } = await import("@/app/components/map/Map");

    // WHEN
    render(<Map />);
    expect(loadHandler).toBeTypeOf("function");

    const loadPromise = loadHandler!();

    // THEN
    expect(addStructuresMarkerImage).toHaveBeenCalledTimes(1);
    expect(addStructuresLayers).not.toHaveBeenCalled();

    // WHEN
    markerDeferred.resolve();
    await loadPromise;

    // THEN
    expect(addStructuresLayers).toHaveBeenCalledTimes(1);
  });
});

