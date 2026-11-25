const CONTOUR_SAMPLE_COUNT = 200;

export const computeAreaCentroid = (points: Point[]): Point | null => {
  let doubleSignedArea = 0;
  let weightedX = 0;
  let weightedY = 0;

  points.forEach((current, index) => {
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    doubleSignedArea += cross;
    weightedX += (current.x + next.x) * cross;
    weightedY += (current.y + next.y) * cross;
  });

  if (Math.abs(doubleSignedArea) < Number.EPSILON) {
    return null;
  }

  return {
    x: weightedX / (3 * doubleSignedArea),
    y: weightedY / (3 * doubleSignedArea),
  };
};

export const getPathVisualCenterOnScreen = (
  path: SVGPathElement
): Point | null => {
  const screenMatrix = path.getScreenCTM();
  const centroid = getCachedCentroid(path);

  if (!screenMatrix || !centroid) {
    return null;
  }

  const { x, y } = new DOMPoint(centroid.x, centroid.y).matrixTransform(
    screenMatrix
  );
  return { x, y };
};

const centroidByPath = new WeakMap<SVGPathElement, Point | null>();

const getCachedCentroid = (path: SVGPathElement): Point | null => {
  if (!centroidByPath.has(path)) {
    centroidByPath.set(path, computeAreaCentroid(sampleContour(path)));
  }
  return centroidByPath.get(path) ?? null;
};

const sampleContour = (path: SVGPathElement): Point[] => {
  const totalLength = path.getTotalLength();
  const step = totalLength / CONTOUR_SAMPLE_COUNT;

  return Array.from({ length: CONTOUR_SAMPLE_COUNT }, (_, index) => {
    const { x, y } = path.getPointAtLength(index * step);
    return { x, y };
  });
};

type Point = { x: number; y: number };
