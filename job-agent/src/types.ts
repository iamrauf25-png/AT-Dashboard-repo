export type JobStatus =
  | "new" // fetched, passed filters (or not yet checked), not scored
  | "filtered_out" // failed a hard filter
  | "scored" // scored, below the shortlist cut
  | "shortlisted" // in the top N, materials drafted
  | "applied"
  | "assessment" // test or assignment requested
  | "interview"
  | "offer"
  | "rejected"
  | "skipped"; // you decided not to apply

export interface RawJob {
  source: string; // greenhouse | lever | ashby | adzuna | manual | gmail
  sourceId: string; // id within that source
  company: string;
  title: string;
  location: string;
  remote: boolean;
  url: string;
  description: string; // plain text
  /** True when we only have a short summary (job-alert emails, Adzuna), not the full job description. */
  snippetOnly?: boolean;
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
  best_track: string; // which of your CVs to build the application on
  reasons: string[];
  gaps: string[];
  red_flags: string[];
}

export interface InboxEvent {
  at: string;
  from: string;
  subject: string;
  kind: string;
  summary: string;
  action?: string;
  jobId?: string; // the tracked job this email is about, if any
}

export interface Job extends RawJob {
  id: string; // `${source}:${sourceId}`
  firstSeen: string;
  status: JobStatus;
  filterReason?: string;
  tracks?: string[]; // tracks whose titles this job matched
  score?: ScoreResult;
  materialsDir?: string;
  appliedAt?: string;
  followUpDraftedAt?: string;
  inbox?: InboxEvent[];
  notes: { at: string; text: string }[];
}
