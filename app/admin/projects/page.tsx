import { redirect } from "next/navigation";

import AdminProjectsDashboard from "@/components/admin/AdminProjectsDashboard";
import { getAdminSession } from "@/lib/auth/session";

export const metadata = {
  title: "Admin Project Dashboard"
};

const AdminProjectsPage = async () => {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/sign-in");
  }
  return <AdminProjectsDashboard />;
};

export default AdminProjectsPage;

