import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";

export const AmountBadge = ({ amount }: Props): ReactElement => {
  if (!amount || amount === 0) {
    return <></>;
  }
  return amount > 0 ? (
    <Badge type="success">Excédent</Badge>
  ) : (
    <Badge type="error">Déficit</Badge>
  );
};

type Props = {
  amount: number | null | undefined;
};
