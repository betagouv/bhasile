"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { useEffect, useState } from "react";
import {
  Control,
  FieldValues,
  Path,
  useController,
  UseControllerProps,
} from "react-hook-form";

import { useAddressSuggestion } from "@/app/hooks/useAddressSuggestion";
import {
  AutocompleteSuggestion,
  useAutocomplete,
} from "@/app/hooks/useAutocomplete";

import { Autocomplete } from "./Autocomplete";

export default function AddressWithValidation<
  TFieldValues extends FieldValues = FieldValues,
>({
  id,
  control,
  fullAddress,
  zipCode,
  street,
  city,
  department,
  latitude,
  longitude,
  required = false,
  className,
  label,
  disabled = false,
  onSelectSuggestion,
}: AddressWithValidationProps<TFieldValues>) {
  const finalControl = control;

  const { field: fullAddressField, fieldState: fullAddressFieldState } =
    useController({
      name: fullAddress as Path<TFieldValues>,
      control,
      rules: {
        required,
      },
    });

  const zipCodeFieldResult = useController({
    name: zipCode as Path<TFieldValues>,
    control: finalControl,
    rules: { required },
  });

  const streetFieldResult = useController({
    name: street as Path<TFieldValues>,
    control: finalControl,
    rules: { required },
  });

  const cityFieldResult = useController({
    name: city as Path<TFieldValues>,
    control: finalControl,
    rules: { required },
  });

  const departmentFieldResult = useController({
    name: department as Path<TFieldValues>,
    control: finalControl,
    rules: { required },
  });

  const latFieldResult = useController({
    name: (latitude || "_lat") as Path<TFieldValues>,
    control: finalControl,
  });

  const longFieldResult = useController({
    name: (longitude || "_long") as Path<TFieldValues>,
    control: finalControl,
  });

  const addressSuggestions = useAddressSuggestion();

  // TODO : isolate this logic in a hook
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualError, setManualError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isFocused && hasInteracted && !hasSelected && fullAddressField.value) {
      setManualError(
        "Veuillez sélectionner une adresse dans la liste déroulante"
      );
    } else if (!fullAddressField.value || hasSelected) {
      setManualError(undefined);
    }
  }, [isFocused, hasInteracted, hasSelected, fullAddressField.value]);

  const {
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    handleInputChange,
    resetSuggestions,
  } = useAutocomplete<AddressSuggestion>(addressSuggestions);

  const handleFullAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    fullAddressField.onChange(value);
    handleInputChange(value);

    setHasInteracted(true);

    if (value) {
      setHasSelected(false);
    }

    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (
    suggestion: AutocompleteSuggestion | null
  ) => {
    if (!suggestion) {
      resetSuggestions();
      return;
    }

    setHasSelected(true);
    setManualError(undefined);
    const addressSuggestion = suggestion as AddressSuggestion;

    fullAddressField.onChange(addressSuggestion.label);

    if (zipCode) {
      zipCodeFieldResult.field.onChange(addressSuggestion.postcode || "");
    }

    if (street) {
      if (addressSuggestion.housenumber && addressSuggestion.street) {
        streetFieldResult.field.onChange(
          `${addressSuggestion.housenumber} ${addressSuggestion.street}`
        );
      } else if (addressSuggestion.street) {
        streetFieldResult.field.onChange(addressSuggestion.street);
      } else if (addressSuggestion.name) {
        streetFieldResult.field.onChange(addressSuggestion.name);
      } else {
        streetFieldResult.field.onChange(
          addressSuggestion.label.split(",")[0] || ""
        );
      }
    }

    if (city) {
      cityFieldResult.field.onChange(addressSuggestion.city || "");
    }
    if (department) {
      if (addressSuggestion.context) {
        const contextParts = addressSuggestion.context.split(",");
        if (contextParts.length > 0) {
          const departmentValue = contextParts[0].trim();
          departmentFieldResult.field.onChange(departmentValue);
        } else {
          departmentFieldResult.field.onChange("");
        }
      } else {
        departmentFieldResult.field.onChange("");
      }
    }

    if (addressSuggestion.y && latitude) {
      latFieldResult.field.onChange(addressSuggestion.y.toString());
    }

    if (addressSuggestion.x && longitude) {
      longFieldResult.field.onChange(addressSuggestion.x.toString());
    }

    setShowSuggestions(false);
    onSelectSuggestion?.();
  };

  const handleBlur = () => {
    fullAddressField.onBlur();
    setIsFocused(false);
    if (hasInteracted && !hasSelected && fullAddressField.value) {
      setManualError(
        "Veuillez sélectionner une adresse dans la liste déroulante"
      );
    } else {
      setManualError(undefined);
    }
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    setIsFocused(true);
  };

  return (
    <div className={className}>
      <div className="relative">
        <Input
          disabled={disabled}
          nativeInputProps={{
            ...fullAddressField,
            id,
            onChange: handleFullAddressChange,
            value: fullAddressField.value || "",
            autoComplete: "off",
            type: "text",
            onBlur: handleBlur,
            onFocus: handleFocus,
            "aria-autocomplete": "list",
            "aria-controls": "autocomplete-suggestions",
            "aria-expanded": showSuggestions && suggestions.length > 0,
            "aria-activedescendant":
              showSuggestions && suggestions.length > 0
                ? `suggestion-0`
                : undefined,
            role: "combobox",
          }}
          label={label || "Adresse complète"}
          state={
            fullAddressFieldState.invalid || manualError ? "error" : "default"
          }
          stateRelatedMessage={
            fullAddressFieldState.error?.message || manualError
          }
        />

        <Autocomplete
          suggestions={suggestions}
          isLoading={isLoading}
          showSuggestions={showSuggestions}
          onSelect={handleSelectSuggestion}
          listClassName="max-h-60"
          className="top-18"
          emptyMessage="Continuez à saisir votre adresse"
        />
      </div>

      <div>
        {zipCode && (
          <input
            {...zipCodeFieldResult.field}
            aria-hidden="true"
            type="hidden"
          />
        )}
        {street && (
          <input
            {...streetFieldResult.field}
            aria-hidden="true"
            type="hidden"
          />
        )}
        {city && (
          <input {...cityFieldResult.field} aria-hidden="true" type="hidden" />
        )}
        {department && (
          <input
            {...departmentFieldResult.field}
            aria-hidden="true"
            type="hidden"
          />
        )}
        {latitude && (
          <input
            {...latFieldResult.field}
            value={latFieldResult.field.value ?? ""}
            onChange={latFieldResult.field.onChange}
            aria-hidden="true"
            type="hidden"
          />
        )}
        {longitude && (
          <input
            {...longFieldResult.field}
            value={longFieldResult.field.value ?? ""}
            onChange={longFieldResult.field.onChange}
            aria-hidden="true"
            type="hidden"
          />
        )}
      </div>
    </div>
  );
}

type AddressSuggestion = AutocompleteSuggestion & {
  score: number;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  context?: string;
  type?: string;
  x?: number;
  y?: number;
  importance?: number;
  name?: string;
};

type AddressWithValidationProps<
  TFieldValues extends FieldValues = FieldValues,
> = Partial<UseControllerProps<TFieldValues>> & {
  id?: string;
  fullAddress: string;
  zipCode?: string;
  street?: string;
  city?: string;
  department?: string;
  latitude?: string;
  longitude?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  control?: Control<TFieldValues>;
  onSelectSuggestion?: () => void;
};
