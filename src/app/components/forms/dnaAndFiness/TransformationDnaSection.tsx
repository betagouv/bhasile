import { BHASILE_CONTACT_EMAIL } from "@/constants";
import { DnaStructureFormValues } from "@/schemas/forms/base/dna.schema";
import { EntityId } from "@/types/Entity.type";

import { DnaInput } from "../adresseAdministrativeAndAntenne/DnaInput";
import { TransformationCodeSection } from "./TransformationCodeSection";

const FICHE_PARAMETRAGE_URL =
  "/07-Fiche_de_parametrage_OFII-transformation_parc.xlsx";
const INSTRUCTIONS_URL = "/Instruction%20INTV2609238J.pdf";
const FAQ_URL = "/11-FAQ%20Transformation%20HUDA%20en%20CADA_FV.pdf";

const emptyDnaStructure: DnaStructureFormValues = {
  dna: {
    code: "",
    description: "",
  },
};

export const TransformationDnaSection = ({ entityId }: Props) => {
  return (
    <TransformationCodeSection
      fieldArrayName="dnaStructures"
      emptyItem={emptyDnaStructure}
      singleCodeLabel="Code DNA"
      addButtonLabel="Ajouter un code DNA"
      descriptionHint="ex : Site d’Avranches Nord et Sud ou Extension 2022"
      getDescriptionFieldName={(index) =>
        `dnaStructures.${index}.dna.description`
      }
      renderCodeInput={(index, label) => (
        <DnaInput index={index} label={label} entityId={entityId} />
      )}
      title={
        <>
          Veuillez ne retenir qu’un seul code DNA pour l’ensemble de la
          structure (sauf cas exceptionnels). Si vous ne trouvez pas votre code
          DNA dans les suggestions,{" "}
          <a href={`mailto:${BHASILE_CONTACT_EMAIL}`} className="underline">
            contactez-nous
          </a>
          .
        </>
      }
      noticeDescription={
        <>
          Veuillez vous assurer qu’une{" "}
          <a
            href={FICHE_PARAMETRAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            fiche de paramétrage
          </a>{" "}
          a été transmise à l’OFII.{" "}
          <em>
            Ressources :{" "}
            <a
              href={INSTRUCTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instructions
            </a>{" "}
            et{" "}
            <a
              href={FAQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              FAQ
            </a>
          </em>
        </>
      }
    />
  );
};

type Props = {
  entityId?: EntityId;
};
