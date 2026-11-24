export type JobStatus =
  | "new" // fetched, not yet checked
  | "filtered_out" // failed a hard filter
  | "scored" // scored, below the shortlist cut
  | "shortlisted" // in today's top N, materials drafted
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "skipped"; // you decided not to apply

export interface RawJob {
  source: string; // greenhouse | lever | ashby | adzuna | manual
  sourceId: string; // id within that source
  company: string;
  title: string;
  location: string;
  remote: boolean;
  url: string;
  description: string; // plain text
  postedAt?: string; // ISO date if the source gives one
  salary?: string;
}

export interface ScoreResult {
  overall: number; // weighted, computed in code
  skills_match: number;
  seniority_fit: number;
  domain_fit: number;
  logistics_fit: number;
  verdict: "strong" | "possible" | "weak";
  reasons: string[];
  gaps: string[];
  red_flags: string[];
}

export interface Job extends RawJob {
  id: string; // `${source}:${sourceId}`
  firstSeen: string;
  status: JobStatus;
  filterReason?: string;
  score?: ScoreResult;
  materialsDir?: string;
  appliedAt?: string;
  followUpDraftedAt?: string;
  notes: { at: string; text: string }[];
}
