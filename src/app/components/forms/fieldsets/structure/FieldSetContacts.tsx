import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFormContext } from "react-hook-form";

import { ContactType } from "@/types/contact.type";

import InputWithValidation from "../../InputWithValidation";

export const FieldSetContacts = () => {
  const { control } = useFormContext();

  return (
    <>
      <h2 className="text-xl font-bold mb-0 text-title-blue-france">
        Contacts
      </h2>

      <Notice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center [&_.fr-notice\_\_desc]:text-text-default-grey [&_div_div]:px-4 [&_div_div]:py-3 [&_div]:px-0 py-0"
        description="Veuillez renseigner en contact principal la personne responsable de la structure et en contact secondaire la personne en charge du suivi opérationnel et/ou de la gestion budgétaire et financière."
      />

      <fieldset className="flex flex-col gap-6">
        <legend className="text-lg font-bold mb-4 text-title-blue-france">
          Contact principal
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputWithValidation
            name="contacts.0.type"
            id="contacts.0.type"
            control={control}
            type="hidden"
            label="type"
            defaultValue={ContactType.PRINCIPAL}
          />
          <InputWithValidation
            name="contacts.0.prenom"
            id="contacts.0.prenom"
            control={control}
            type="text"
            label="Prénom"
          />
          <InputWithValidation
            name="contacts.0.nom"
            id="contacts.0.nom"
            control={control}
            type="text"
            label="Nom"
          />
          <InputWithValidation
            name="contacts.0.role"
            id="contacts.0.role"
            control={control}
            type="text"
            label="Fonction"
          />
          <InputWithValidation
            name="contacts.0.id"
            id="contacts.0.id"
            control={control}
            type="hidden"
            label="id"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputWithValidation
            name="contacts.0.email"
            id="contacts.0.email"
            control={control}
            type="email"
            label="Email"
          />
          <InputWithValidation
            name="contacts.0.telephone"
            id="contacts.0.telephone"
            control={control}
            type="tel"
            label="Téléphone"
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="text-lg font-bold mb-4 text-title-blue-france">
          Contact secondaire
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputWithValidation
            name="contacts.1.type"
            id="contacts.1.type"
            control={control}
            type="hidden"
            label="type"
            defaultValue={ContactType.SECONDAIRE}
          />
          <InputWithValidation
            name="contacts.1.prenom"
            id="contacts.1.prenom"
            control={control}
            type="text"
            label="Prénom"
          />
          <InputWithValidation
            name="contacts.1.nom"
            id="contacts.1.nom"
            control={control}
            type="text"
            label="Nom"
          />
          <InputWithValidation
            name="contacts.1.role"
            id="contacts.1.role"
            control={control}
            type="text"
            label="Fonction"
          />
          <InputWithValidation
            name="contacts.1.id"
            id="contacts.1.id"
            control={control}
            type="hidden"
            label="id"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputWithValidation
            name="contacts.1.email"
            id="contacts.1.email"
            control={control}
            type="email"
            label="Email"
          />
          <InputWithValidation
            name="contacts.1.telephone"
            id="contacts.1.telephone"
            control={control}
            type="tel"
            label="Téléphone"
          />
        </div>
      </fieldset>
    </>
  );
};
