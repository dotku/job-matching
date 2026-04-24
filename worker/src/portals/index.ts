import { ashbyAdapter } from "./ashby.js";
import { greenhouseAdapter } from "./greenhouse.js";
import { leverAdapter } from "./lever.js";
import { smartrecruitersAdapter } from "./smartrecruiters.js";
import type { PortalAdapter } from "./types.js";

export const portals: PortalAdapter[] = [
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  smartrecruitersAdapter,
];

export function findAdapter(url: string): PortalAdapter | null {
  return portals.find((p) => p.matches(url)) ?? null;
}

export type { PortalAdapter, SubmitContext, SubmitResult } from "./types.js";
