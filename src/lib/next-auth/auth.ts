import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { getServerSession, NextAuthOptions } from "next-auth";

import { createOrUpdateUser } from "@/app/api/users/user.service";

import {
  ACCEPTED_ACR_VALUES,
  AuthError,
  checkAcr,
  rejectUrl,
} from "./auth-error";
import { getPermissionsFromSession, ProConnectUser } from "./auth-util";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user?.email;

      try {
        if (!email) {
          throw new AuthError(
            "email_absent",
            "email absent du profil ProConnect"
          );
        }

        const acr = checkAcr(account?.id_token);

        console.info("[auth] connexion acceptée", {
          email,
          acr,
          provider: account?.provider,
        });

        return true;
      } catch (error) {
        const errorObject =
          error instanceof AuthError
            ? error
            : new AuthError(
                "erreur_technique",
                "erreur inattendue pendant la connexion",
                error
              );

        console.error("[auth] connexion refusée", {
          email: email ?? "(inconnu)",
          reason: errorObject.reason,
          message: errorObject.message,
          cause:
            errorObject.cause instanceof Error
              ? errorObject.cause.message
              : errorObject.cause,
        });

        return rejectUrl(errorObject.reason);
      }
    },

    async jwt({ token, account, user }) {
      if (!account) {
        return token;
      }

      try {
        const { prenom, nom } = (user ?? {}) as ProConnectUser;

        token.id_token = account.id_token;
        token.provider = account.provider;
        token.user_id = user?.id;
        token.prenom = prenom;
        token.nom = nom;
        token.name =
          prenom && nom ? `${prenom} ${nom}` : (user?.name ?? token.name);
      } catch (error) {
        console.error("[auth] JWT incomplet", {
          provider: account.provider,
          cause: error instanceof Error ? error.message : error,
        });
      }

      return token;
    },

    async session({ token, session }) {
      let permissions:
        Awaited<ReturnType<typeof getPermissionsFromSession>> | undefined;

      try {
        permissions = await getPermissionsFromSession(session);
      } catch (error) {
        console.error("[auth] chargement des permissions impossible", {
          email: session.user?.email,
          cause: error instanceof Error ? error.message : error,
        });
      }

      try {
        await createOrUpdateUser({
          name: session.user?.name as string,
          email: session.user?.email as string,
        });
      } catch (error) {
        console.error(
          "[auth] erreur dans l'ajout ou la mise à jour de l'utilisateur",
          {
            email: session.user?.email,
            cause: error instanceof Error ? error.message : error,
          }
        );
      }

      return {
        ...session,
        user: {
          ...session.user,
          ...(permissions ?? {}),
          prenom: token.prenom,
        },
        id_token: token.id_token,
        provider: token.provider,
        user_id: token.user_id,
        name: token.name,
      };
    },
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/connexion",
    error: "/connexion?accesRefuse=true",
  },
  providers: [
    {
      id: "proconnect",
      name: "Pro Connect",
      type: "oauth",
      idToken: true,
      clientId: process.env.PRO_CONNECT_ID,
      clientSecret: process.env.PRO_CONNECT_SECRET,
      wellKnown:
        process.env.PRO_CONNECT_BASE_URL +
        "/v2/.well-known/openid-configuration",
      allowDangerousEmailAccountLinking: true, // TODO : supprimer dans une prochaine PR et voir si ça pose problème à certains users en prod
      checks: ["nonce", "state"],
      authorization: {
        params: {
          scope: "openid uid given_name usual_name email siret",
          acr_values: "eidas1-mfa",
          claims: JSON.stringify({
            id_token: {
              acr: {
                essential: true,
                values: ACCEPTED_ACR_VALUES,
              },
            },
          }),
          redirect_uri:
            process.env.NEXT_PUBLIC_URL + "/api/auth/callback/proconnect",
        },
      },
      client: {
        authorization_signed_response_alg: "RS256",
        id_token_signed_response_alg: "RS256",
        userinfo_encrypted_response_alg: "RS256",
        userinfo_signed_response_alg: "RS256",
        userinfo_encrypted_response_enc: "RS256",
      },
      userinfo: {
        async request(context) {
          const url = `${process.env.PRO_CONNECT_BASE_URL}/v2/userinfo`;

          let body: string;
          try {
            const reponse = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${context.tokens.access_token}`,
              },
            });

            if (!reponse.ok) {
              throw new Error(`HTTP ${reponse.status} ${reponse.statusText}`);
            }

            body = await reponse.text();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            throw new Error(`[proconnect] appel userinfo échoué : ${message}`);
          }

          try {
            const segment = body.split(".")[1];
            if (!segment) {
              throw new Error("Aucun segment JWT");
            }
            const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
            return JSON.parse(
              Buffer.from(base64, "base64").toString("utf8")
            ) as Record<string, unknown>;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `[proconnect] décodage de la réponse userinfo impossible : ${message}`
            );
          }
        },
      },
      profile: async (profile) => {
        return {
          id: profile.email,
          prenom: profile.given_name,
          nom: profile.usual_name,
          email: profile.email,
          poste: profile.belonging_population,
          proconnect_info: profile,
        };
      },
    },
  ],
};

export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}
