import Button from "@codegouvfr/react-dsfr/Button";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
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
  const { watch, setValue } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const contacts = (watch("contacts") || [emptyContact]) as ContactFormValues[];

  const notice = isMultiAntenne
    ? "Veuillez renseigner le contact d’au moins une personne responsable de la structure, de l’opérationnel et/ou du financier. Indiquez également un responsable de chaque site."
    : "Veuillez renseigner le contact d’au moins une personne responsable de la structure, de l’opérationnel et/ou du financier.";

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

      <CustomNotice severity="info" title="" description={notice} />

      {contacts.map((_, index) => (
        <Contact
          key={index}
          isMultiAntenne={isMultiAntenne}
          handleDelete={index < 1 ? undefined : handleDelete}
          index={index}
        />
      ))}

      <Button
        type="button"
        iconId="fr-icon-add-line"
        priority="tertiary no outline"
        className="underline font-normal p-0"
        onClick={handleAddNewContact}
      >
        Ajouter un contact
      </Button>
    </>
  );
};
