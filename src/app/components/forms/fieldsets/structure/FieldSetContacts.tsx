import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { ContactApiType } from "@/schemas/api/contact.schema";

import { Contact } from "../../contacts/Contact";

export const FieldSetContacts = () => {
  const { control, watch } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const contacts = (watch("contacts") || [{}, {}]) as ContactApiType[];

  const notice = isMultiAntenne
    ? "Veuillez renseigner le contact de la personne responsable de la structure et celui de la personne responsable de l’opérationnel et/ou du financier."
    : "Veuillez renseigner les contacts d’au moins deux personnes dont celle responsable de la structure et celle responsable de l’opérationnel et/ou du financier. Indiquez également un responsable de chaque antenne.";

  const handleDelete = (index: number) => {
    console.log(index);
  };

  const handleAddNewContact = () => {
    console.log("add new contact");
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
          iconId="fr-icon-add-line"
          priority="tertiary no outline"
          className="underline font-normal p-0"
          onClick={handleAddNewContact}
        >
          + Ajouter un contact
        </Button>
      )}
    </>
  );
};
