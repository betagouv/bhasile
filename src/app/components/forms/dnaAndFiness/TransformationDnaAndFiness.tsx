import { useFormContext } from "react-hook-form";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import { EntityId } from "@/types/Entity.type";

import { TransformationDnaSection } from "./TransformationDnaSection";
import { TransformationFinessSection } from "./TransformationFinessSection";

export const TransformationDnaAndFiness = ({ entityId }: Props) => {
  const { watch } = useFormContext();

  const type = watch("type");
  const isAutorisee = isStructureAutorisee(type);

  return (
    <>
      <TransformationDnaSection entityId={entityId} />
      {isAutorisee && (
        <>
          <hr />
          <TransformationFinessSection />
        </>
      )}
    </>
  );
};

type Props = {
  entityId?: EntityId;
};
