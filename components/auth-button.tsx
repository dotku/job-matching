import { Link } from "@nextui-org/link";

import { auth0 } from "@/lib/auth0";

export async function AuthButton() {
  let session: Awaited<ReturnType<typeof auth0.getSession>> | null = null;

  try {
    session = await auth0.getSession();
  } catch {
    session = null;
  }

  if (session?.user) {
    const label =
      (session.user.email as string | undefined) ??
      (session.user.name as string | undefined) ??
      "Account";

    return (
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-xs text-default-500 max-w-[12rem] truncate">
          {label}
        </span>
        <Link
          className="text-sm"
          color="foreground"
          href="/auth/logout"
          size="sm"
        >
          Log out
        </Link>
      </div>
    );
  }

  return (
    <Link className="text-sm" color="primary" href="/auth/login" size="sm">
      Log in
    </Link>
  );
}
