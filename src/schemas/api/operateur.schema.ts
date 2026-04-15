import z from "zod";

export const operateurApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  name: z.string().min(1, "Le nom de l'opérateur est requis"),
});

export type OperateurApiWrite = z.infer<typeof operateurApiSchema>;

export type OperateurApiRead = {
  id: number;
  name: string;
  directionGenerale?: string | null;
  siret?: string | null;
  siegeSocial?: string | null;
  vulnerabilites: string[];
};
