import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import { cn } from "@/app/utils/classname.util";

export const TransformationMenuItem = ({
  index,
  label,
  url,
  isActive,
  disabled,
  children,
}: Props) => {
  const router = useRouter();

  return (
    <div>
      <Button
        className={cn(
          "px-6 py-0 text-title-blue-france mb-0 flex items-center gap-3 w-full",
          isActive ? "font-bold" : "",
          disabled ? "cursor-default" : ""
        )}
        priority="tertiary no outline"
        onClick={() => {
          if (url) {
            router.push(url);
          }
        }}
        disabled={disabled}
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-active-blue-france text-white font-medium">
          {index}
        </span>
        {label}
      </Button>
      {children}
    </div>
  );
};

type Props = {
  index: number;
  label: string;
  url?: string;
  isActive?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
};
