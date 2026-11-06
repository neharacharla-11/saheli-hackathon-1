/* Recommend suggestions she has sent. Kept on her device; status refreshed from the server. */

export type SuggestionTopic = "song" | "recipe" | "workout" | "feature" | "other";
export type SuggestionStatus = "received" | "working" | "added";

export interface Suggestion {
  id: string;
  token?: string; // server token (absent if it couldn't be sent)
  secret?: string;
  topic: SuggestionTopic;
  text: string;
  name?: string;
  sentAt: string; // ISO time
  status: SuggestionStatus;
  sent: boolean; // false when the server store isn't switched on yet
}

export const TOPIC_LABEL: Record<SuggestionTopic, string> = {
  song: "A song or chant",
  recipe: "A recipe",
  workout: "A workout",
  feature: "A feature",
  other: "Anything else",
};

export const STATUS_LABEL: Record<SuggestionStatus, string> = {
  received: "Received",
  working: "Working on it",
  added: "Added",
};
