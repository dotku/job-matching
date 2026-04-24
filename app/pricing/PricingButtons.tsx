"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

import { CheckoutPlan, startCheckoutAction, startPortalAction } from "./actions";

interface CheckoutButtonProps {
  plan: CheckoutPlan;
  children: React.ReactNode;
  variant?: "solid" | "bordered";
}

export function CheckoutButton({
  plan,
  children,
  variant = "solid",
}: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        className="w-full"
        color={variant === "solid" ? "primary" : "default"}
        isLoading={pending}
        variant={variant}
        onPress={async () => {
          setPending(true);
          setError(null);
          const result = await startCheckoutAction(plan);

          // startCheckoutAction redirects on success, so reaching this line
          // means we got an ActionError back.
          if (result && "error" in result) setError(result.error);
          setPending(false);
        }}
      >
        {children}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function PortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        className="w-full"
        color="primary"
        isLoading={pending}
        variant="bordered"
        onPress={async () => {
          setPending(true);
          setError(null);
          const result = await startPortalAction();

          if (result && "error" in result) setError(result.error);
          setPending(false);
        }}
      >
        Manage subscription
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
