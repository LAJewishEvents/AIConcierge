export type BrainMode = "local" | "llm";

export type Event = {
  id: string;
  title: string;
  startISO?: string;
  endISO?: string;
  location?: string;
  url?: string;
  description?: string;
  source?: string;
  tags?: string[];
  score?: number;
};

export type UserPrefs = {
  neighborhood?: string;
  vibe?: "social" | "classy" | "chill" | "any";
  ageRange?: string;
  brain?: BrainMode;
  timezone?: string;
};
