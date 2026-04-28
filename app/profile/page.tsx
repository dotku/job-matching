import { Metadata } from "next";
import Link from "next/link";

import { loadProfileAction } from "@/app/apply/actions";
import { LlmSettingsPanel } from "@/app/apply/LlmSettings";
import { readIdentity } from "@/lib/identity";

import { ProfileDetails } from "./ProfileDetails";
import { ProfileTargetLocations } from "./ProfileTargetLocations";

export const metadata: Metadata = {
  title: "Profile — Settings & AI credits",
  description:
    "Manage your preferred locations, LLM provider settings (BYOK), and credit balance.",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const identity = await readIdentity();
  const { candidate } = await loadProfileAction();

  return (
    <section className="py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Profile</h1>
        <p className="text-default-500 text-sm md:text-base">
          Configure how auto-apply behaves for you — preferences, AI
          provider, credit balance, billing.
        </p>
      </div>

      {!candidate ? (
        <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-3">
          <p className="text-sm">
            You haven&apos;t saved a profile yet.
          </p>
          <Link
            className="text-sm rounded-medium bg-primary text-primary-foreground px-4 py-2 inline-block w-fit"
            href="/apply"
          >
            Go to Apply to set up your resume →
          </Link>
        </div>
      ) : (
        <>
          <AccountCard
            authEmail={identity.email}
            emailVerified={identity.emailVerified}
            isAuthenticated={identity.isAuthenticated}
            profileEmail={candidate.email}
            profileName={candidate.fullName}
          />
          <ProfileDetails candidate={candidate} />
          <ProfileTargetLocations
            initial={candidate.targetLocations ?? ""}
          />
          <LlmSettingsPanel />
          <NavLinks />
        </>
      )}
    </section>
  );
}

function AccountCard({
  profileName,
  profileEmail,
  authEmail,
  isAuthenticated,
  emailVerified,
}: {
  profileName: string;
  profileEmail: string;
  authEmail: string | null;
  isAuthenticated: boolean;
  emailVerified: boolean;
}) {
  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-2">
      <div className="text-sm font-medium">Account</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-default-500">Name</div>
          <div className="font-medium">{profileName}</div>
        </div>
        <div>
          <div className="text-xs text-default-500">Profile email</div>
          <div className="font-medium">{profileEmail}</div>
        </div>
        <div>
          <div className="text-xs text-default-500">Auth provider</div>
          <div className="font-medium">
            {isAuthenticated ? (
              <>
                Google{" "}
                <span
                  className={
                    emailVerified
                      ? "text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-success-100 text-success-700"
                      : "text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700"
                  }
                >
                  {emailVerified ? "verified" : "unverified"}
                </span>
              </>
            ) : (
              <span className="text-default-500">not signed in</span>
            )}
          </div>
          {authEmail && authEmail !== profileEmail && (
            <div className="text-[11px] text-default-500 mt-0.5">
              signed in as {authEmail}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-default-500">Change resume</div>
          <Link
            className="text-sm text-primary underline"
            href="/apply"
          >
            Apply page →
          </Link>
        </div>
      </div>
    </div>
  );
}

function NavLinks() {
  return (
    <div className="flex items-center gap-3 text-sm text-default-500">
      <Link className="text-primary underline" href="/dashboard">
        Dashboard
      </Link>
      ·
      <Link className="text-primary underline" href="/apply">
        Resume &amp; auto-apply cookies
      </Link>
      ·
      <Link className="text-primary underline" href="/pricing">
        Plans &amp; billing
      </Link>
    </div>
  );
}
