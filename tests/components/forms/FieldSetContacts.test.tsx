import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";

import { createContact } from "../../test-utils/contact.factory";
import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

describe("FieldSetContacts", () => {
  describe("Rendering", () => {
    it("should render all contact fields for each contact", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            isMultiAntenne: true,
            contacts: [
              createContact({ id: 1 }),
              createContact({ id: 2 }),
              createContact({ id: 3 }),
            ],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      expect(screen.getAllByLabelText("Prénom")[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Nom")[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Fonction")[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Email")[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Téléphone")[0]).toBeInTheDocument();

      expect(screen.getAllByLabelText("Prénom")[1]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Nom")[1]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Fonction")[1]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Email")[1]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Téléphone")[1]).toBeInTheDocument();

      expect(screen.getAllByLabelText("Prénom")[2]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Nom")[2]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Fonction")[2]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Email")[2]).toBeInTheDocument();
      expect(screen.getAllByLabelText("Téléphone")[2]).toBeInTheDocument();
    });

    it("should display guidance notice", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [createContact({}), createContact({})],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/Veuillez renseigner les contacts/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/responsable de la structure/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form interactions", () => {
    it("should update prenom field value", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ prenom: "" }, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const prenomInput = screen.getAllByLabelText("Prénom")[0];
      await user.type(prenomInput, "Jean");

      await waitFor(() => {
        expect(prenomInput).toHaveValue("Jean");
      });
    });

    it("should update nom field value", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ nom: "" }, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const nomInput = screen.getAllByLabelText("Nom")[0];
      await user.type(nomInput, "Dupont");

      await waitFor(() => {
        expect(nomInput).toHaveValue("Dupont");
      });
    });

    it("should update role field value", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ role: "" }, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const roleInput = screen.getAllByLabelText("Fonction")[0];
      await user.type(roleInput, "Directeur");

      await waitFor(() => {
        expect(roleInput).toHaveValue("Directeur");
      });
    });

    it("should update email field value", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ email: "" }, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const emailInput = screen.getAllByLabelText("Email")[0];
      await user.type(emailInput, "jean.dupont@example.com");

      await waitFor(() => {
        expect(emailInput).toHaveValue("jean.dupont@example.com");
      });
    });

    it("should update telephone field value", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ telephone: "" }, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const telephoneInput = screen.getAllByLabelText("Téléphone")[0];
      await user.type(telephoneInput, "0123456789");

      await waitFor(() => {
        expect(telephoneInput).toHaveValue("0123456789");
      });
    });
  });

  describe("Form interactions - another contact", () => {
    it("should update all fields independently from principal contact", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [
              {
                prenom: "Jean",
                nom: "Dupont",
                role: "Directeur",
                email: "jean@example.com",
                telephone: "0123456789",
              },
              { prenom: "", nom: "", role: "", email: "", telephone: "" },
            ],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const prenomInputs = screen.getAllByLabelText("Prénom");
      await user.type(prenomInputs[1], "Marie");

      const nomInputs = screen.getAllByLabelText("Nom");
      await user.type(nomInputs[1], "Martin");

      const roleInputs = screen.getAllByLabelText("Fonction");
      await user.type(roleInputs[1], "Gestionnaire");

      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "marie@example.com");

      const telephoneInputs = screen.getAllByLabelText("Téléphone");
      await user.type(telephoneInputs[1], "9876543210");

      await waitFor(() => {
        expect(prenomInputs[0]).toHaveValue("Jean");
        expect(nomInputs[0]).toHaveValue("Dupont");

        expect(prenomInputs[1]).toHaveValue("Marie");
        expect(nomInputs[1]).toHaveValue("Martin");
        expect(roleInputs[1]).toHaveValue("Gestionnaire");
        expect(emailInputs[1]).toHaveValue("marie@example.com");
        expect(telephoneInputs[1]).toHaveValue("9876543210");
      });
    });
  });

  describe("Hidden ID fields", () => {
    it("should have hidden id field for each contact", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{ id: 123 }, { id: 456 }],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const hiddenIdInput = container.querySelector(
        'input[name="contacts.0.id"]'
      );
      expect(hiddenIdInput).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle partial contact data", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            contacts: [
              { prenom: "Jean", nom: "Dupont", email: "" },
              { email: "contact@example.com" },
            ],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      const prenomInputs = screen.getAllByLabelText("Prénom");
      const emailInputs = screen.getAllByLabelText("Email");

      expect(prenomInputs[0]).toHaveValue("Jean");
      expect(emailInputs[0]).toHaveValue("");
      expect(prenomInputs[1]).toHaveValue("");
      expect(emailInputs[1]).toHaveValue("contact@example.com");
    });
  });

  describe("Form field names", () => {
    it("should have correct name attributes for each contact", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{}, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      expect(
        container.querySelector('[name="contacts.0.prenom"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.0.nom"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.0.role"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.0.email"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.0.telephone"]')
      ).toBeInTheDocument();
    });

    it("should have correct name attributes for secondary contact", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            contacts: [{}, {}],
          }}
        >
          <FieldSetContacts />
        </FormTestWrapper>
      );

      expect(
        container.querySelector('[name="contacts.1.prenom"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.1.nom"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.1.role"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.1.email"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[name="contacts.1.telephone"]')
      ).toBeInTheDocument();
    });
  });
});
