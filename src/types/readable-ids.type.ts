export const ALL_READABLE = "all";

export type ReadableIds = number[] | typeof ALL_READABLE;

export type ReadableEntities = {
  structureIds: ReadableIds;
  cpomIds: ReadableIds;
};

export const ALL_READABLE_ENTITIES: ReadableEntities = {
  structureIds: ALL_READABLE,
  cpomIds: ALL_READABLE,
};
