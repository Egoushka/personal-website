/**
 * The newsletter list behind /mira/: a public, single opt-in list in listmonk,
 * subscribed through the public form endpoint on this origin (the edge routes
 * only /subscription/ to listmonk). The UUID is the list's public identifier.
 */
export const MIRA_LIST_UUID = "82a58395-1a03-4a3f-a33c-11f9df4dc3da";
export const MIRA_FORM_ACTION = "/subscription/form";

export const MIRA_DOWNLOADS = [
  { href: "/mira/00-inbox-triage.json", label: "Inbox-triage workflow (n8n JSON)" },
  { href: "/mira/00-inbox-triage.md", label: "Setup notes for the workflow" },
  { href: "/mira/free-5.md", label: "5 prompts" },
] as const;
