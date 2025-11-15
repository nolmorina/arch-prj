"use client";

import type { ReactNode } from "react";

import type { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

type Props = {
  children: ReactNode;
  session?: Session | null;
};

const SessionProvider = ({ children, session }: Props) => (
  <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
);

export default SessionProvider;



