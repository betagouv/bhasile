import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";

export const EvaluationNote = ({ value }: Props): ReactElement => {
  return (
    <>
      <NumberDisplay value={Number(value)} />
      <span className="text-disabled-grey">&nbsp;/4</span>
    </>
  );
};

type Props = {
  value: string | number | Date;
};
