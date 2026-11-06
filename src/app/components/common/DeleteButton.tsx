import Button from "@codegouvfr/react-dsfr/Button";

import { cn } from "@/app/utils/classname.util";

export const DeleteButton = ({
  className,
  onClick,
  size = "medium",
  backgroundColor = "white",
  title = "Supprimer",
}: Props) => {
  return (
    <Button
      iconId="fr-icon-delete-bin-line"
      priority="tertiary no outline"
      className={cn(
        "rounded-full",
        backgroundColor === "grey" ? "bg-gray-100!" : "bg-white!",
        className
      )}
      title={title}
      onClick={onClick}
      type="button"
      size={size}
    />
  );
};

type Props = {
  className?: string;
  onClick: (e: React.MouseEvent) => void;
  size?: "small" | "medium";
  backgroundColor?: "white" | "grey";
  title?: string;
};
