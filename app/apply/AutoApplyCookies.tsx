"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

import {
  clearAutoApplyCookiesAction,
  saveAutoApplyCookiesAction,
} from "./actions";

interface Props {
  initiallyHasCookies: boolean;
}

/**
 * Lets the candidate paste their exported browser cookies so the worker
 * can reuse their logged-in session on Greenhouse/Lever/Ashby. Cookies
 * are AES-256-GCM encrypted at rest.
 */
export function AutoApplyCookies({ initiallyHasCookies }: Props) {
  const [hasCookies, setHasCookies] = useState(initiallyHasCookies);
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<
    | { kind: "idle" }
    | { kind: "saved"; summary: string }
    | { kind: "error"; text: string }
  >({ kind: "idle" });

  async function handleSave() {
    setBusy(true);
    setMsg({ kind: "idle" });
    try {
      const result = await saveAutoApplyCookiesAction(raw);

      if (result.ok) {
        setMsg({ kind: "saved", summary: result.data.summary });
        setHasCookies(true);
        setRaw("");
        setOpen(false);
      } else {
        setMsg({ kind: "error", text: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      const result = await clearAutoApplyCookiesAction();

      if (result.ok) {
        setHasCookies(false);
        setMsg({ kind: "idle" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Auto-apply session cookies</div>
        {hasCookies && (
          <span className="text-[10px] uppercase tracking-wide text-success-700 bg-success-100 px-2 py-0.5 rounded-full">
            stored
          </span>
        )}
      </div>

      <p className="text-xs text-default-500 leading-relaxed">
        Paste your logged-in browser cookies so the worker submits as you
        (basic fields + resume pulled from your Greenhouse/Lever/Ashby profile
        automatically). Stored AES-256-GCM encrypted.
      </p>

      {!open && !hasCookies && (
        <div>
          <Button size="sm" variant="flat" onPress={() => setOpen(true)}>
            Paste cookies
          </Button>
        </div>
      )}

      {!open && hasCookies && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="flat" onPress={() => setOpen(true)}>
            Replace
          </Button>
          <Button
            color="danger"
            isDisabled={busy}
            isLoading={busy}
            size="sm"
            variant="light"
            onPress={handleClear}
          >
            Clear
          </Button>
          {msg.kind === "saved" && (
            <span className="text-xs text-default-500">
              Last saved: {msg.summary}
            </span>
          )}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-32 rounded-medium border border-default-200 bg-default-100 px-3 py-2 text-xs font-mono"
            placeholder='Paste JSON array here — e.g. [{"name":"_session","value":"...","domain":"greenhouse.io", ...}, ...]'
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <details className="text-xs text-default-500">
            <summary className="cursor-pointer">How to export</summary>
            <ol className="list-decimal list-inside mt-1 space-y-1 leading-relaxed">
              <li>
                Install the{" "}
                <a
                  className="underline"
                  href="https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Cookie-Editor
                </a>{" "}
                extension.
              </li>
              <li>
                Log in at{" "}
                <code className="text-[10px]">my.greenhouse.io</code> (and any
                board you want to auto-apply on).
              </li>
              <li>
                Open the extension on that tab → <b>Export</b> → <b>JSON</b>.
              </li>
              <li>Paste the array here.</li>
              <li>
                <b>Do not share</b> this JSON — it contains your session tokens.
                Replace or clear anytime.
              </li>
            </ol>
          </details>
          <div className="flex gap-2">
            <Button
              color="primary"
              isDisabled={!raw.trim() || busy}
              isLoading={busy}
              size="sm"
              onPress={handleSave}
            >
              Save
            </Button>
            <Button
              isDisabled={busy}
              size="sm"
              variant="flat"
              onPress={() => {
                setOpen(false);
                setRaw("");
                setMsg({ kind: "idle" });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {msg.kind === "error" && (
        <p className="text-xs text-danger">{msg.text}</p>
      )}
    </div>
  );
}
