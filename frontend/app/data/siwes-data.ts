/* SIWES / Industrial Training (IT) — data model. Level-gated (400L). */
import type { Tone } from "../types";

/** Lifecycle of a student's industrial-training placement. */
export type SiwesState =
  | "none"
  | "proposed"
  | "rejected"
  | "approved"
  | "ongoing"
  | "completed";

export interface SiwesStateMeta {
  label: string;
  tone: Tone;
}

export interface Company {
  name: string;
  address: string;
  industry: string;
}

export interface Coord {
  lat: number;
  lng: number;
}

export const SIWES_STATES: Record<SiwesState, SiwesStateMeta> = {
  none: { label: "Not started", tone: "neutral" },
  proposed: { label: "Awaiting department approval", tone: "warning" },
  rejected: { label: "Proposal rejected", tone: "danger" },
  approved: { label: "Approved — placement confirmed", tone: "success" },
  ongoing: { label: "Ongoing", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
};

export const SAMPLE_COMPANIES: Company[] = [
  { name: "Zenith Systems Ltd.", address: "12 Adeola Odeku St, Victoria Island, Lagos", industry: "Software Engineering" },
  { name: "NNPC ICT Directorate", address: "NNPC Towers, Herbert Macaulay Way, Abuja", industry: "Information Technology" },
  { name: "Interswitch Group", address: "Plot 1648, Oko-Awo Close, Victoria Island, Lagos", industry: "Fintech" },
  { name: "Dangote Industries — IT Dept.", address: "Union Marble House, Falomo, Lagos", industry: "Enterprise IT" },
];

// demo placement site coordinate + a "you are here" simulated coordinate
export const PLACEMENT_COORD: Coord = { lat: 6.4281, lng: 3.4219 }; // Victoria Island, Lagos

/** Grouped namespace mirroring the old `window.SIWES_DATA` shape. */
export const SIWES_DATA = { SIWES_STATES, SAMPLE_COMPANIES, PLACEMENT_COORD };
