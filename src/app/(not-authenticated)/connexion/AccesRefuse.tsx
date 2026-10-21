"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement, useEffect, useRef } from "react";

import { ExternalLink } from "@/app/components/common/ExternalLink";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import {
  AUTH_FAILURE_ALERTS,
  AuthAlert,
  DEFAULT_AUTH_ALERT,
  isAuthFailureReason,
  NEXTAUTH_ERROR_ALERTS,
} from "@/lib/next-auth/auth-failure";

type AccesRefuseProps = {
  reason?: string | null;
  error?: string | null;
};

export const AccesRefuse = ({
  reason,
  error,
}: AccesRefuseProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);

  const alert: AuthAlert =
    (isAuthFailureReason(reason) ? AUTH_FAILURE_ALERTS[reason] : undefined) ??
    (error ? NEXTAUTH_ERROR_ALERTS[error] : undefined) ??
    DEFAULT_AUTH_ALERT;

  useEffect(() => {
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return (
    <div ref={containerRef} className="max-w-150 my-10">
      <Alert
        title={alert.title}
        description={
          <span>
            {alert.description}{" "}
            <ExternalLink
              url={`mailto:${BHASILE_CONTACT_EMAIL}`}
              title="Contacter le support"
            />
          </span>
        }
        severity={alert.severity}
      />
    </div>
  );
};
