import { redirect } from "next/navigation";

import AdminSignInCard from "@/components/admin/AdminSignInCard";
import { getAdminSession } from "@/lib/auth/session";

type AdminSignInPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export const metadata = {
  title: "Admin Sign In"
};

const AdminSignInPage = async ({ searchParams = {} }: AdminSignInPageProps) => {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/projects");
  }

  const errorParam = searchParams.error;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <AdminSignInCard errorCode={errorCode} />
    </div>
  );
};

export default AdminSignInPage;


