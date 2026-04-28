"use client";

import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";

import {
  LlmStatus,
  addByokKeyAction,
  deleteByokKeyAction,
  getLlmStatusAction,
  setActiveByokKeyAction,
} from "./actions";
import type { ByokKey, ByokProvider } from "@/lib/llm-keys";

/** Micro-cents → "$0.0123" display. 1 micro-cent = 10^-8 USD. */
function formatCreditsUsd(microCents: number): string {
  const usd = microCents / 1e8;

  if (!Number.isFinite(usd)) return "$0.00";
  if (Math.abs(usd) >= 1) return `$${usd.toFixed(2)}`;

  return `$${usd.toFixed(4)}`;
}

/** Micro-cents → sparse USD for fine-grained per-call costs. */
function formatMicroCentsUsd(microCents: number): string {
  const usd = microCents / 1e8;

  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd >= 0.0001) return `$${usd.toFixed(4)}`;

  return `$${usd.toFixed(6)}`;
}

const PROVIDERS: ByokProvider[] = [
  "openrouter",
  "cerebras",
  "openai",
  "gemini",
];

const MODEL_DEFAULTS: Record<ByokProvider, string> = {
  cerebras: "llama3.1-8b",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash-lite",
  openrouter: "openrouter/auto",
};

const MODEL_HINTS: Record<ByokProvider, string> = {
  cerebras: "any Cerebras model id — e.g. llama3.1-8b, llama-3.3-70b, qwen-3-coder-480b",
  openai: "any OpenAI chat model — e.g. gpt-4o-mini, gpt-4.1, o4-mini",
  gemini: "any Gemini model id — e.g. gemini-2.5-flash-lite, gemini-2.5-pro",
  openrouter:
    "any OpenRouter model slug — e.g. openrouter/auto, anthropic/claude-sonnet-4.5, google/gemini-2.5-flash-lite, deepseek/deepseek-v3.1",
};

const KEY_PLACEHOLDER: Record<ByokProvider, string> = {
  cerebras: "csk-…",
  openai: "sk-…",
  gemini: "AIza…",
  openrouter: "sk-or-v1-…",
};

export function LlmSettingsPanel() {
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

  const load = async () => {
    const result = await getLlmStatusAction();

    if (result.ok) setStatus(result.data);
    else setLoadErr(result.error);
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSetActive(keyId: string) {
    setBusyKeyId(keyId);
    try {
      const result = await setActiveByokKeyAction(keyId);

      if (result.ok) await load();
    } finally {
      setBusyKeyId(null);
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm("Remove this key? LLM calls will fall back to the next active key or our default.")) {
      return;
    }
    setBusyKeyId(keyId);
    try {
      const result = await deleteByokKeyAction(keyId);

      if (result.ok) await load();
    } finally {
      setBusyKeyId(null);
    }
  }

  if (loadErr)
    return <p className="text-xs text-danger">Failed to load LLM status: {loadErr}</p>;
  if (!status)
    return (
      <div className="rounded-large border border-default-200 bg-content1 p-4 text-sm text-default-500">
        Loading AI credits…
      </div>
    );

  const usingByok = !!status.activeKey;
  const lowCredits = !usingByok && status.creditsMicroCents < 100_000; // < $0.001

  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">AI credits &amp; BYOK</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
        <div className="rounded-medium bg-default-50 p-3">
          <div className="text-xs text-default-500">Credit balance</div>
          <div
            className={
              lowCredits
                ? "font-mono text-danger-600 font-semibold"
                : "font-mono font-semibold"
            }
          >
            {formatCreditsUsd(status.creditsMicroCents)}
          </div>
          {lowCredits && (
            <div className="text-[11px] text-danger-600 mt-0.5">
              Low — add your own API key below to keep verifying.
            </div>
          )}
        </div>
        <div className="rounded-medium bg-default-50 p-3">
          <div className="text-xs text-default-500">LLM calls used</div>
          <div className="font-mono font-semibold">
            {status.usage.totalCalls.toLocaleString()}
          </div>
          <div className="text-[11px] text-default-500 mt-0.5">
            Lifetime spend {formatCreditsUsd(status.usage.spentMicroCents)}
          </div>
        </div>
        <div className="rounded-medium bg-default-50 p-3">
          <div className="text-xs text-default-500">Active provider</div>
          <div className="font-medium">
            {usingByok
              ? `${status.activeKey!.provider} · ${status.activeKey!.model}`
              : "Default (we pay)"}
          </div>
          <div className="text-[11px] text-default-500 mt-0.5">
            {usingByok
              ? "Routed through your API key — no credit deduction."
              : "Using Gemini Flash Lite via our gateway."}
          </div>
        </div>
      </div>

      {status.usage.byKind.length > 0 && (
        <div className="text-xs text-default-500">
          Usage by kind:{" "}
          {status.usage.byKind
            .map(
              (k) =>
                `${k.kind} (${k.calls.toLocaleString()} · ${(k.inputTokens + k.outputTokens).toLocaleString()} tokens)`,
            )
            .join(" · ")}
        </div>
      )}

      {status.usage.byModel.length > 0 && (
        <div className="rounded-medium border border-default-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-default-100 text-default-600">
              <tr>
                <th className="text-left font-medium px-2 py-1.5">
                  Provider · Model
                </th>
                <th className="text-right font-medium px-2 py-1.5">Calls</th>
                <th className="text-right font-medium px-2 py-1.5">In tok</th>
                <th className="text-right font-medium px-2 py-1.5">Out tok</th>
                <th className="text-right font-medium px-2 py-1.5">Spent</th>
              </tr>
            </thead>
            <tbody>
              {status.usage.byModel.map((m) => (
                <tr
                  className="border-t border-default-200"
                  key={`${m.provider}/${m.model}`}
                >
                  <td className="px-2 py-1.5 font-mono">
                    {m.provider}/{m.model}
                    {m.byokCalls > 0 && (
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        BYOK {m.byokCalls}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {m.calls.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {m.inputTokens.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {m.outputTokens.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {m.costMicroCents > 0
                      ? formatMicroCentsUsd(m.costMicroCents)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status.recentCalls.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-default-600 hover:text-default-800">
            Recent {status.recentCalls.length} LLM calls
          </summary>
          <div className="mt-2 rounded-medium border border-default-200 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-default-100 text-default-600">
                <tr>
                  <th className="text-left font-medium px-2 py-1.5">When</th>
                  <th className="text-left font-medium px-2 py-1.5">Kind</th>
                  <th className="text-left font-medium px-2 py-1.5">
                    Provider · Model
                  </th>
                  <th className="text-right font-medium px-2 py-1.5">In</th>
                  <th className="text-right font-medium px-2 py-1.5">Out</th>
                  <th className="text-right font-medium px-2 py-1.5">Cost</th>
                </tr>
              </thead>
              <tbody>
                {status.recentCalls.map((c) => (
                  <tr
                    className="border-t border-default-200"
                    key={c.id}
                  >
                    <td className="px-2 py-1.5 text-default-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-1.5">{c.kind}</td>
                    <td className="px-2 py-1.5 font-mono">
                      {c.provider}/{c.model}
                      {c.byok && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full bg-primary-100 text-primary-700">
                          BYOK
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {c.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {c.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {c.byok
                        ? "—"
                        : c.costMicroCents > 0
                          ? formatMicroCentsUsd(c.costMicroCents)
                          : "$0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="flex flex-col gap-2 border-t border-default-200 pt-3">
        <div className="flex items-baseline justify-between">
          <div className="text-xs font-medium text-default-700">
            Your API keys ({status.keys.length})
          </div>
          {!showAdd && (
            <Button size="sm" variant="flat" onPress={() => setShowAdd(true)}>
              Add a key
            </Button>
          )}
        </div>

        {status.keys.length === 0 && !showAdd && (
          <p className="text-xs text-default-500">
            No keys saved yet. Add one from Cerebras, OpenAI, or Gemini to
            route LLM calls through your account (and bypass our credit
            deduction).
          </p>
        )}

        {status.keys.length > 0 && (
          <ul className="flex flex-col gap-2">
            {status.keys.map((k) => (
              <KeyRow
                busy={busyKeyId === k.id}
                key={k.id}
                keyRow={k}
                onActivate={() => handleSetActive(k.id)}
                onDelete={() => handleDelete(k.id)}
              />
            ))}
          </ul>
        )}

        {showAdd && (
          <AddKeyForm
            onCancel={() => setShowAdd(false)}
            onSaved={async () => {
              setShowAdd(false);
              await load();
            }}
          />
        )}
      </div>
    </div>
  );
}

function KeyRow({
  keyRow,
  busy,
  onActivate,
  onDelete,
}: {
  keyRow: ByokKey;
  busy: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-medium border border-default-200 bg-default-50/50 p-3 flex flex-col md:flex-row md:items-center gap-2">
      <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
        <input
          checked={keyRow.isActive}
          className="accent-primary"
          disabled={busy}
          name="byokActive"
          type="radio"
          onChange={onActivate}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {keyRow.label ?? `${keyRow.provider} · ${keyRow.model}`}
            {keyRow.isActive && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-success-700 bg-success-100 px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-default-500 truncate">
            {keyRow.provider} · {keyRow.model} · added{" "}
            {new Date(keyRow.createdAt).toLocaleDateString()}
          </div>
        </div>
      </label>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          color="danger"
          isDisabled={busy}
          size="sm"
          variant="light"
          onPress={onDelete}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function AddKeyForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [provider, setProvider] = useState<ByokProvider>("openrouter");
  const [model, setModel] = useState<string>(MODEL_DEFAULTS.openrouter);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handleProviderChange(p: ByokProvider) {
    setProvider(p);
    setModel(MODEL_DEFAULTS[p]);
  }

  async function handleSave() {
    setBusy(true);
    setErr(null);
    try {
      const result = await addByokKeyAction({
        provider,
        model,
        apiKey,
        label,
      });

      if (!result.ok) {
        setErr(result.error);

        return;
      }
      setApiKey("");
      setLabel("");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-medium border border-dashed border-default-300 p-3 flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            className={
              provider === p
                ? "text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"
                : "text-xs px-3 py-1.5 rounded-full bg-default-100 text-default-700 hover:bg-default-200"
            }
            type="button"
            onClick={() => handleProviderChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <Input
        description={`Free-form — ${MODEL_HINTS[provider]}`}
        label="Model"
        size="sm"
        value={model}
        onValueChange={setModel}
      />
      <Input
        description="Optional. Shown in the list so you can tell keys apart."
        label="Label"
        placeholder="e.g. work account, personal"
        size="sm"
        value={label}
        onValueChange={setLabel}
      />
      <Input
        description="Your key is AES-256-GCM encrypted at rest. We never log it."
        label="API key"
        placeholder={KEY_PLACEHOLDER[provider]}
        size="sm"
        type="password"
        value={apiKey}
        onValueChange={setApiKey}
      />
      {err && <p className="text-xs text-danger">{err}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          color="primary"
          isDisabled={busy || !apiKey.trim() || !model.trim()}
          isLoading={busy}
          size="sm"
          onPress={handleSave}
        >
          Save key
        </Button>
        <Button isDisabled={busy} size="sm" variant="flat" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
