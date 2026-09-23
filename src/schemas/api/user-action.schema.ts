import z from "zod";

export const userActionStructureApiSchema = z.object({
  structureId: z.number().optional(),
});

export const userActionDetailsApiSchema = z.object({
  details: z.record(z.string(), z.string()).optional(),
});

export type UserActionStructureApiType = z.infer<
  typeof userActionStructureApiSchema
>;

export type UserActionDetailsApiType = z.infer<
  typeof userActionDetailsApiSchema
>;

export type UserActionApiType =
  UserActionStructureApiType | UserActionDetailsApiType;
