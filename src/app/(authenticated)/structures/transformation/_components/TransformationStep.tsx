import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { cn } from "@/app/utils/classname.util";
import { Step } from "@/app/utils/transformation.util";
import { StructureTransformationType } from "@/types/transformation.type";

export const TransformationStep = ({ step }: Props) => {
  const { transformationId } = useParams();

  const pathname = usePathname();
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-[3.1rem] top-0 bottom-0 w-[1.5px] bg-[radial-gradient(circle,#6b7cff_0.5px,transparent_1px)] bg-[length:1.5px_5px] bg-repeat-y bg-top"
      />
      <div className="relative flex items-center gap-3 uppercase font-bold text-xs text-title-blue-france pl-9 mb-2">
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full bg-white text-title-blue-france"
          )}
        >
          {getIcon(step.type)}
        </span>
        {getLabel(step.type, step.codeBhasile)}
      </div>
      <div className="flex flex-col gap-2">
        {step.steps.map((stepItem) => {
          const href = getLink(
            stepItem.route,
            Number(transformationId),
            step.id,
            step.type
          );
          const isActive = href && pathname.includes(href);
          return (
            <Link
              key={stepItem.route}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block py-2 pl-19 hover:font-bold text-sm hover:bg-white",
                isActive ? "bg-white" : ""
              )}
            >
              {stepItem.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

type Props = {
  step: Step;
};

const getLink = (
  route: string,
  transformationId?: number,
  idStep?: number,
  type?: StructureTransformationType
) => {
  if (!transformationId || !idStep || !type || !route) {
    return "";
  }

  switch (type) {
    case StructureTransformationType.EXTENSION:
      return `/structures/transformation/${transformationId}/extension/${idStep}/${route}`;
    case StructureTransformationType.CONTRACTION:
      return `/structures/transformation/${transformationId}/contraction/${idStep}/${route}`;
    case StructureTransformationType.FERMETURE:
      return `/structures/transformation/${transformationId}/fermeture/${idStep}/${route}`;
    case StructureTransformationType.CREATION:
      return `/structures/transformation/${transformationId}/creation/${idStep}/${route}`;
    default:
      return "";
  }
};

const getLabel = (type?: StructureTransformationType, codeBhasile?: string) => {
  const code = codeBhasile ?? "";
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return `Extension ${code}`.trim();
    case StructureTransformationType.CONTRACTION:
      return `Contraction ${code}`.trim();
    case StructureTransformationType.FERMETURE:
      return `Fermeture ${code}`.trim();
    case StructureTransformationType.CREATION:
      return `Nouvelle structure`;
    default:
      return "";
  }
};

const getIcon = (type?: StructureTransformationType) => {
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return <i className="ri-expand-diagonal-line " />;
    case StructureTransformationType.CONTRACTION:
      return <i className="ri-collapse-diagonal-line" />;
    case StructureTransformationType.CREATION:
      return <i className="fr-icon-add-line" />;
    case StructureTransformationType.FERMETURE:
      return (
        <Image
          src="/transformation-fermeture.svg"
          alt=""
          aria-hidden="true"
          width={18}
          height={18}
        />
      );

    default:
      return "";
  }
};
