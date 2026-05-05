import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

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
        priority="tertiary no outline"
        iconId="fr-icon-arrow-right-line"
        className=""
        onClick={() => {
          if (url) {
            router.push(url);
          }
        }}
        disabled={disabled}
      >
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
