import Button from "@codegouvfr/react-dsfr/Button";

import { useSearchParamsNavigation } from "@/app/hooks/useSearchParamsNavigation";

export const FiltersReset = ({
  closePanel,
  label = "Réinitialiser (Tout sélectionner)",
  filters = ["search", "type", "bati", "places"],
  isActive,
}: Props) => {
  const navigateWithParams = useSearchParamsNavigation();

  const handleReset = () => {
    navigateWithParams((params) => {
      filters.forEach((filter) => {
        params.delete(filter);
      });
    });
    closePanel();
  };

  return (
    <Button
      disabled={!isActive}
      priority="tertiary no outline"
      className="w-full -mt-2 flex justify-center py-3 text-sm font-bold"
      onClick={handleReset}
    >
      {label}
    </Button>
  );
};

type Props = {
  closePanel: () => void;
  label?: string;
  filters?: string[];
  isActive: boolean;
};
