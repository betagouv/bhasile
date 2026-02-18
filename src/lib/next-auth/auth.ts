import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { getServerSession, NextAuthOptions } from "next-auth";
import { v4 as uuidv4 } from "uuid";

import { getIsUserAuthorized, ProConnectUser, upsertUser } from "./auth-util";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user?.email;
      if (!email) {
        return false;
      }
      try {
        const isUserAuthorized = await getIsUserAuthorized(email);
        if (isUserAuthorized) {
          await upsertUser(user as ProConnectUser);
        }
        return isUserAuthorized;
      } catch (error) {
        console.error("Erreur de connexion", error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        const { prenom, nom } = user as ProConnectUser;
        token.id_token = account.id_token;
        token.provider = account.provider;
        token.user_id = user.id;
        token.name = `${prenom} ${nom}`;
      }
      return token;
    },
    async session({ token, session }) {
      return {
        ...session,
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
    error: "/acces-refuse",
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
      allowDangerousEmailAccountLinking: true,
      checks: ["nonce", "state"],
      authorization: {
        params: {
          scope: "openid uid given_name usual_name email siret",
          acr_values: "eidas1",
          redirect_uri:
            process.env.NEXT_PUBLIC_URL + "/api/auth/callback/proconnect",
          nonce: uuidv4(),
          state: uuidv4(),
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
          try {
            const userInfo = await fetch(
              process.env.PRO_CONNECT_BASE_URL + "/v2/userinfo",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${context.tokens.access_token}`,
                },
              }
            ).then((res) => {
              return res.text();
            });
            return JSON.parse(
              Buffer.from(userInfo.split(".")[1], "base64").toString()
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            throw new Error(error);
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
