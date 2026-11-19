"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, ReactNode, useState } from "react";

import { AccountStatus } from "@/app/api/users/user.util";
import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { formatDate } from "@/app/utils/date.util";
import { normalizeWords } from "@/app/utils/string.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import { useAgents } from "@/hooks/useAgents";
import { useModalTarget } from "@/hooks/useModalTarget";
import { AgentFormValues } from "@/schemas/forms/base/agent.schema";
import {
  PerimeterFormValues,
  toPerimeterApiCreate,
} from "@/schemas/forms/base/perimeter.schema";
import { AgentRead, PerimeterRead, ZoneOption } from "@/types/agent.type";
import { FetchState } from "@/types/fetch-state.type";
import { AGENT_STATUS_LABELS } from "@/utils/agent.util";

import {
  ACCESS_ACTIONS,
  AgentAccessModal,
  agentAccessModal,
  AgentAccessTarget,
} from "./AgentAccessModal";
import { AgentAddModal, agentAddModal, AgentDraft } from "./AgentAddModal";
import {
  AgentDeactivateModal,
  agentDeactivateModal,
} from "./AgentDeactivateModal";
import {
  PerimeterCreateModal,
  perimeterCreateModal,
} from "./PerimeterCreateModal";

export const AgentsManager = ({
  agents,
  perimeters,
  zones,
}: Props): ReactElement => {
  const { addPerimeter, addAgent, updateAgentAccess } = useAgents();
  const { getFetchState } = useFetchState();
  const [status, setStatus] = useState<AccountStatus>("PENDING");
  const [search, setSearch] = useState("");
  const perimeterModal =
    useModalTarget<PerimeterCreation>(perimeterCreateModal);
  const addModal = useModalTarget<AgentDraft>(agentAddModal);
  const accessModal = useModalTarget<AgentAccessTarget>(agentAccessModal);
  const deactivateModal = useModalTarget<AgentRead>(agentDeactivateModal);

  const { mutate: savePerimeter } = useSaveMutation(
    AGENTS_SAVE_KEY,
    (values: PerimeterFormValues) => addPerimeter(toPerimeterApiCreate(values))
  );
  const { mutate: saveAgent } = useSaveMutation(AGENTS_SAVE_KEY, addAgent);
  const { mutate: saveAccess } = useSaveMutation(
    AGENTS_SAVE_KEY,
    updateAgentAccess
  );
  const isSaving = getFetchState(AGENTS_SAVE_KEY) === FetchState.LOADING;

  const searchedAgents = agents.filter((agent) =>
    normalizeWords(`${agent.email} ${agent.name ?? ""}`).includes(
      normalizeWords(search)
    )
  );
  const shownAgents = searchedAgents.filter((agent) => agent.status === status);

  const getSegment = (value: AccountStatus) => ({
    label: `${AGENT_STATUS_LABELS[value]} (${searchedAgents.filter((agent) => agent.status === value).length})`,
    nativeInputProps: {
      value,
      checked: status === value,
      onChange: () => setStatus(value),
    },
  });

  const getActions = (agent: AgentRead): ReactNode => (
    <div className="flex gap-2 justify-end">
      <Button
        priority="tertiary no outline"
        size="small"
        onClick={() => accessModal.open({ agent })}
      >
        {ACCESS_ACTIONS[agent.status].label}
      </Button>
      {agent.status === "ACTIVATED" && (
        <Button
          priority="tertiary no outline"
          size="small"
          onClick={() => deactivateModal.open(agent)}
        >
          Désactiver
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <Button iconId="fr-icon-add-line" onClick={() => addModal.open(null)}>
          Ajouter un agent
        </Button>
        <Button
          priority="secondary"
          iconId="fr-icon-add-line"
          onClick={() => perimeterModal.open(null)}
        >
          Créer un périmètre
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <SegmentedControl
          legend="Statut des comptes"
          hideLegend
          segments={[
            getSegment("PENDING"),
            getSegment("ACTIVATED"),
            getSegment("DEACTIVATED"),
          ]}
        />
        <Input
          label="Rechercher par email ou nom"
          className="mb-0 w-80"
          nativeInputProps={{
            value: search,
            onChange: (event) => setSearch(event.target.value),
          }}
        />
      </div>

      {shownAgents.length === 0 ? (
        <p className="text-mention-grey">Aucun compte dans cette liste.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-default-grey rounded-[10px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default-grey text-left">
                {["Email", "Nom", "Périmètre", "Dernière connexion"].map(
                  (header) => (
                    <th key={header} scope="col" className="px-6 py-3">
                      {header}
                    </th>
                  )
                )}
                <th scope="col" className="px-6 py-3">
                  <span className="fr-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shownAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b border-default-grey last:border-b-0"
                >
                  <td className="px-6 py-3">{agent.email}</td>
                  <td className="px-6 py-3">{agent.name ?? "—"}</td>
                  <td className="px-6 py-3">{agent.perimeter?.name ?? "—"}</td>
                  <td className="px-6 py-3">
                    {agent.lastConnection
                      ? formatDate(agent.lastConnection)
                      : "Jamais"}
                  </td>
                  <td className="px-6 py-3">{getActions(agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PerimeterCreateModal
        openCount={perimeterModal.openCount}
        zones={zones}
        perimeters={perimeters}
        isSaving={isSaving}
        onSubmit={async (values) => {
          const perimeter = await savePerimeter(values);
          if (perimeter) {
            perimeterModal.target?.reopen(perimeter.id);
          }
          return perimeter !== null;
        }}
      />
      <AgentAddModal
        draft={addModal.target}
        openCount={addModal.openCount}
        perimeters={perimeters}
        isSaving={isSaving}
        onSubmit={async (values: AgentFormValues) =>
          (await saveAgent(values)) !== null
        }
        onCreatePerimeter={(draft) =>
          perimeterModal.open({
            reopen: (perimeterId) => addModal.open({ ...draft, perimeterId }),
          })
        }
      />
      <AgentAccessModal
        target={accessModal.target}
        openCount={accessModal.openCount}
        perimeters={perimeters}
        isSaving={isSaving}
        onSubmit={async (agentId, perimeterId) =>
          (await saveAccess(agentId, { status: "ACTIVATED", perimeterId })) !==
          null
        }
        onCreatePerimeter={(agent) =>
          perimeterModal.open({
            reopen: (perimeterId) => accessModal.open({ agent, perimeterId }),
          })
        }
      />
      <AgentDeactivateModal
        agent={deactivateModal.target}
        isSaving={isSaving}
        onConfirm={async (agentId) =>
          (await saveAccess(agentId, { status: "DEACTIVATED" })) !== null
        }
      />
    </div>
  );
};

const AGENTS_SAVE_KEY = "agents-save";

type PerimeterCreation = {
  reopen: (perimeterId: number) => void;
};

type Props = {
  agents: AgentRead[];
  perimeters: PerimeterRead[];
  zones: ZoneOption[];
};
