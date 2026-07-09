import { cn } from "@/app/utils/classname.util";

export const BlockTitle = ({ title, total, iconClassName }: Props) => {
  return (
    <div className="flex items-center gap-2 p-4">
      <span className={cn("text-title-blue-france", iconClassName)} />
      <h2 className="fr-h6 mb-0 text-title-blue-france">{title}</h2>
      {total ? (
        <span className="flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-active-blue-france text-white font-medium">
          {total}
        </span>
      ) : null}
    </div>
  );
};

type Props = {
  title: string;
  total?: number;
  iconClassName: string;
};
