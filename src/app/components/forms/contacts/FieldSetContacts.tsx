import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { ContactFormValues } from "@/schemas/forms/base/contact.schema";

import { Contact } from "./Contact";

const emptyContact: ContactFormValues = {
  prenom: "",
  nom: "",
  telephone: "",
  email: "",
  role: "",
  perimetre: "",
};

export const FieldSetContacts = () => {
  const { control, watch, setValue, getValues } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const contacts = (watch("contacts") || [
    emptyContact,
    emptyContact,
  ]) as ContactFormValues[];

  const notice = isMultiAntenne
    ? "Veuillez renseigner le contact de la personne responsable de la structure et celui de la personne responsable de l’opérationnel et/ou du financier."
    : "Veuillez renseigner les contacts d’au moins deux personnes dont celle responsable de la structure et celle responsable de l’opérationnel et/ou du financier. Indiquez également un responsable de chaque antenne.";

  useEffect(() => {
    if (!isMultiAntenne) {
      setValue("contacts", [
        getValues("contacts")?.[0],
        getValues("contacts")?.[1],
      ]);
    }
  }, [isMultiAntenne, setValue, getValues]);

  const handleDelete = (index: number) => {
    setValue(
      "contacts",
      contacts.filter((_, i) => i !== index)
    );
  };

  const handleAddNewContact = () => {
    setValue("contacts", [...contacts, emptyContact]);
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-0 text-title-blue-france">
        Contacts
      </h2>

      <Notice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center"
        description={notice}
      />

      {contacts.map((_, index) => (
        <Contact
          key={index}
          control={control}
          isMultiAntenne={isMultiAntenne}
          handleDelete={index < 2 ? undefined : handleDelete}
          index={index}
        />
      ))}

      {isMultiAntenne && (
        <Button
          type="button"
          iconId="fr-icon-add-line"
          priority="tertiary no outline"
          className="underline font-normal p-0"
          onClick={handleAddNewContact}
        >
          Ajouter un contact
        </Button>
      )}
    </>
  );
};
