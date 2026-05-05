import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

export const TransformationMenuItem = ({
  index,
  label,
  url,
  isActive,
  disabled,
}: Props) => {
  const router = useRouter();

  return (
    <Button
      priority="tertiary no outline"
      iconId="fr-icon-arrow-right-line"
      className="fr-sidemenu__link before:content-none"
      onClick={() => {
        if (url) {
          router.push(url);
        }
      }}
      disabled={disabled}
    >
      {label}
    </Button>
  );
};

type Props = {
  index: number;
  label: string;
  url: string;
  isActive: boolean;
  disabled: boolean;
};
