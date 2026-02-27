export interface WinEntry {
  id: string; // nanoid
  timestamp: string; // ISO 8601
  content: string;
  tags: string[];
}

export interface PrEntry {
  id: number;
  number: number;
  repo: string; // "org/repo"
  title: string;
  body: string;
  url: string;
  mergedAt: string;
  labels: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface Store {
  wins: WinEntry[];
  prs: PrEntry[];
  lastPrSync: string | null;
}

export interface Config {
  openrouterApiKey?: string;
  githubToken?: string;
  githubUsername?: string;
  repos: string[]; // ["org/repo"]
  dataDir: string; // default: ~/.wins
}
