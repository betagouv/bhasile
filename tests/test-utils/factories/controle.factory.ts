import { ControleApiType } from "@/schemas/api/controle.schema";
import { ControleType } from "@/types/controle.type";

export const createControle = ({
  id,
  date,
}: CreateControleArgs): ControleApiType => {
  return {
    id: id ?? 1,
    structureDnaCode: "C0001",
    date: date ?? new Date("2022-01-02").toISOString(),
    type: ControleType.INOPINE,
    fileUploads: [
      {
        id: 1,
        key: "uuid-1234.pdf",
      },
    ],
  };
};

type CreateControleArgs = {
  id?: number;
  date?: string;
};
