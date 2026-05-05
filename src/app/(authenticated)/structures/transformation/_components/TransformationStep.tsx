import Link from "next/link";
import { useParams } from "next/navigation";

import { cn } from "@/app/utils/classname.util";
import { Step } from "@/app/utils/transformation.util";
import { StructureTransformationType } from "@/types/transformation.type";

export const TransformationStep = ({ step }: Props) => {
  const { idTransformation, idStructure } = useParams();

  return (
    <div className="relative mt-6">
      <span
        aria-hidden
        className="absolute left-[3.1rem] top-0 bottom-0 w-[3px] bg-[radial-gradient(circle,#6b7cff_1px,transparent_2.1px)] bg-[length:3px_10px] bg-repeat-y bg-top"
      />
      <div className="relative flex items-center gap-3 uppercase font-bold text-xs text-title-blue-france pl-9 mb-2">
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full bg-white text-title-blue-france",
            getIcon(step.type)
          )}
        />
        {getLabel(step.type, step.codeBhasile)}
      </div>
      <div className="flex flex-col gap-2">
        {step.steps.map((stepItem) => (
          <Link
            key={stepItem.route}
            href={getLink(
              stepItem.route,
              Number(idTransformation),
              Number(idStructure),
              step.type
            )}
            className="block py-2 pl-19 hover:font-bold text-sm hover:bg-white"
          >
            {stepItem.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

type Props = {
  step: Step;
};

const getLink = (
  route: string,
  idTransformation?: number,
  idStructure?: number,
  type?: StructureTransformationType
) => {
  if (!idTransformation || !idStructure || !type || !route) {
    return "";
  }

  switch (type) {
    case StructureTransformationType.EXTENSION:
      return `/structures/transformation/${idTransformation}/extension/${idStructure}/${route}`;
    case StructureTransformationType.CONTRACTION:
      return `/structures/transformation/${idTransformation}/contraction/${idStructure}/${route}`;
    case StructureTransformationType.FERMETURE:
      return `/structures/transformation/${idTransformation}/fermeture/${idStructure}/${route}`;
    case StructureTransformationType.CREATION:
      return `/structures/transformation/${idTransformation}/creation/${idStructure}/${route}`;
  }
};

const getLabel = (type?: StructureTransformationType, codeBhasile?: string) => {
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return `Extension ${codeBhasile}`;
    case StructureTransformationType.CONTRACTION:
      return `Contraction ${codeBhasile}`;
    case StructureTransformationType.FERMETURE:
      return `Fermeture ${codeBhasile}`;
    case StructureTransformationType.CREATION:
      return `Nouvelle structure`;
    default:
      return "";
  }
};

const getIcon = (type?: StructureTransformationType) => {
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return "ri-expand-diagonal-line";
    case StructureTransformationType.CONTRACTION:
      return "ri-collapse-diagonal-line";
    case StructureTransformationType.CREATION:
      return "ri-collapse-diagonal-line";
    case StructureTransformationType.FERMETURE:
      return "ri-collapse-diagonal-line";
    default:
      return "";
  }
};
