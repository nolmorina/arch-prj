const normalizeEmail = (value: string) => value.trim().toLowerCase();

const parseAllowlist = () => {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map(normalizeEmail);
};

const adminAllowlist = new Set(parseAllowlist());

export const hasConfiguredAdminAllowlist = adminAllowlist.size > 0;

export const isAllowedAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }
  if (!hasConfiguredAdminAllowlist) {
    return false;
  }
  return adminAllowlist.has(normalizeEmail(email));
};

export const describeAllowlistRequirement = () =>
  hasConfiguredAdminAllowlist
    ? undefined
    : "ADMIN_ALLOWED_EMAILS is empty—no Google accounts can access the admin dashboard.";


