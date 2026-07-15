import Button from "@codegouvfr/react-dsfr/Button";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { areAllValuesEmpty } from "@/app/utils/common.util";
import {
  getTransformationNounAvecArticle,
  isTransformationSurStructureExistante,
} from "@/app/utils/transformation.util";
import { ContactFormValues } from "@/schemas/forms/base/contact.schema";
import { FormKind } from "@/types/global";

import { Contact } from "./Contact";

const emptyContact: ContactFormValues = {
  prenom: "",
  nom: "",
  telephone: "",
  email: "",
  role: "",
  perimetre: "",
};

const MIN_CONTACTS = 1;

type Props = {
  formKind?: FormKind;
  displayPerimetre?: boolean;
};

export const FieldSetContacts = ({
  formKind = FormKind.FINALISATION,
  displayPerimetre = false,
}: Props) => {
  const { watch, setValue } = useFormContext();

  const isMultiAntenne = watch("isMultiAntenne");

  const watchedContacts = watch("contacts") as ContactFormValues[] | undefined;
  const contacts = watchedContacts?.length ? watchedContacts : [emptyContact];

  const title = getTitle(formKind);

  const notice = isMultiAntenne
    ? "Veuillez renseigner le contact d’au moins une personne responsable de la structure, de l’opérationnel et/ou du financier. Indiquez également un responsable de chaque site."
    : "Veuillez renseigner le contact d’au moins une personne responsable de la structure, de l’opérationnel et/ou du financier.";

  const handleDelete = (index: number) => {
    if (contacts.length > MIN_CONTACTS) {
      setValue(
        "contacts",
        contacts.filter((_, contactIndex) => contactIndex !== index)
      );
      return;
    }
    setValue(
      "contacts",
      contacts.map((contact, contactIndex) =>
        contactIndex === index ? emptyContact : contact
      )
    );
  };

  const handleAddNewContact = () => {
    setValue("contacts", [...contacts, emptyContact]);
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-0 text-title-blue-france max-w-3xl">
        {title}
      </h2>

      <CustomNotice severity="info" description={notice} />

      {contacts.map((contact, index) => {
        const canDelete =
          contacts.length > MIN_CONTACTS || !areAllValuesEmpty(contact);
        return (
          <Contact
            key={index}
            isMultiAntenne={displayPerimetre || isMultiAntenne}
            handleDelete={canDelete ? handleDelete : undefined}
            index={index}
          />
        );
      })}

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

const getTitle = (formKind: FormKind): string => {
  if (isTransformationSurStructureExistante(formKind)) {
    return `Veuillez ajouter ou supprimer les contacts afin de ne conserver que ceux qui sont adaptés suite à ${getTransformationNounAvecArticle(
      formKind
    )}.`;
  }
  if (formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES) {
    return "Veuillez mettre à jour les contacts afin de ne conserver que ceux qui sont adaptés à la nouvelle structure.";
  }
  return "Contacts";
};
