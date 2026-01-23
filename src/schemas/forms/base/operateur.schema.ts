import { zId } from "@/app/utils/zodCustomFields";
import z from "zod";

export const operateurSchema = z.object({
  id: zId),
  name: z.string(),
});
