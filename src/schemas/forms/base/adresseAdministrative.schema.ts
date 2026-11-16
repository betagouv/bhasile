import { z } from "zod";

export const adresseAdministrativeSchema = z.object({
  nom: z.string().optional(),
  adresseAdministrativeComplete: z.string().optional(),
  adresseAdministrative: z.string().nonempty(),
  codePostalAdministratif: z.string().nonempty(),
  communeAdministrative: z.string().nonempty(),
  departementAdministratif: z.string().nonempty(),
});

export const adresseAdministrativeAutoSaveSchema =
  adresseAdministrativeSchema.partial();

export const withDepartementAdministratifInPerimetre = <
  TSchema extends z.ZodType<{ departementAdministratif?: string }>,
>(
  schema: TSchema,
  canUpdateDepartement: (departementAdministratif: string) => boolean
): TSchema =>
  schema.check(
    z.superRefine<{ departementAdministratif?: string }>((data, ctx) => {
      const { departementAdministratif } = data;
      if (
        !departementAdministratif ||
        canUpdateDepartement(departementAdministratif)
      ) {
        return;
      }
      ctx.addIssue({
        code: "custom",
        message: `Le département ${departementAdministratif} n’est pas dans votre périmètre.`,
        path: ["adresseAdministrativeComplete"],
      });
    })
  );

export type AdresseAdministrativeFormValues = z.infer<
  typeof adresseAdministrativeSchema
>;
