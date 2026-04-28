"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";

import { updateTargetLocationsAction } from "@/app/apply/actions";

export function ProfileTargetLocations({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<
    | { kind: "idle" }
    | { kind: "saved"; at: number }
    | { kind: "error"; m: string }
  >({ kind: "idle" });

  const dirty = value.trim() !== saved.trim();

  async function handleSave() {
    setBusy(true);
    setMsg({ kind: "idle" });
    try {
      const result = await updateTargetLocationsAction(value);

      if (result.ok) {
        setSaved(result.data.targetLocations ?? "");
        setMsg({ kind: "saved", at: Date.now() });
      } else {
        setMsg({ kind: "error", m: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Preferred locations</div>
        {msg.kind === "saved" && (
          <span className="text-xs text-success-600">
            Saved at {new Date(msg.at).toLocaleTimeString()}
          </span>
        )}
        {msg.kind === "error" && (
          <span className="text-xs text-danger">{msg.m}</span>
        )}
      </div>
      <Input
        isDisabled={busy}
        placeholder="e.g. San Francisco, Seattle, Remote, or Anywhere in the US"
        value={value}
        onValueChange={setValue}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-default-500">
          Used when the LLM answers &ldquo;Where are you looking to work?&rdquo;
          on applications and to filter match recommendations.
        </span>
        <Button
          color="primary"
          isDisabled={!dirty || busy}
          isLoading={busy}
          size="sm"
          onPress={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
