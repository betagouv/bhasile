import { CountCircle } from "@/app/components/common/CountCircle";
import { cn } from "@/app/utils/classname.util";

export const BlockTitle = ({ title, total, iconClassName }: Props) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className={cn("text-title-blue-france", iconClassName)} />
      <h2 className="fr-h6 mb-0 text-title-blue-france">{title}</h2>
      <CountCircle count={total} />
    </div>
  );
};

type Props = {
  title: string;
  total?: number;
  iconClassName: string;
};
