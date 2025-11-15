import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { isAllowedAdminEmail } from "@/lib/auth/allowlist";
import { authOptions } from "@/lib/auth/options";

export const getAdminSession = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions);
  if (session?.user?.email && isAllowedAdminEmail(session.user.email)) {
    return session;
  }
  return null;
};


