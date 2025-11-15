import type { NextAuthOptions, Profile } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import {
  describeAllowlistRequirement,
  hasConfiguredAdminAllowlist,
  isAllowedAdminEmail
} from "@/lib/auth/allowlist";

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const googleClientId = requiredEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
const nextAuthSecret = requiredEnv("NEXTAUTH_SECRET");

if (!hasConfiguredAdminAllowlist) {
  console.warn(describeAllowlistRequirement());
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: {
    strategy: "jwt"
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    })
  ],
  pages: {
    signIn: "/admin/sign-in",
    error: "/admin/sign-in"
  },
  callbacks: {
    async signIn({ user }) {
      const allowed = isAllowedAdminEmail(user.email);
      if (!allowed) {
        console.warn(
          `[auth] Blocked Google sign-in attempt for ${user.email ?? "unknown email"}`
        );
      }
      return allowed;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        if (profile?.email) {
          token.email = profile.email;
        }
        const picture = getProfilePicture(profile);
        if (picture) {
          token.picture = picture;
        }
        const name = getProfileName(profile);
        if (name) {
          token.name = name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    }
  }
};

const getProfilePicture = (profile?: Profile | null) => {
  if (profile && typeof profile === "object" && "picture" in profile) {
    const value = (profile as Record<string, unknown>).picture;
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
};

const getProfileName = (profile?: Profile | null) => {
  if (profile && typeof profile === "object" && "name" in profile) {
    const value = (profile as Record<string, unknown>).name;
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
};


