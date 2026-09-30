// Reasons offered in the uninstall-feedback email/page. Kept in its own module (no server
// imports) so the client feedback page and the admin panel can use it too.
export const UNINSTALL_REASONS = [
  { key: "no_value",     label: "I didn't see useful insights" },
  { key: "setup_hard",   label: "Setup / connecting accounts was too hard" },
  { key: "price",        label: "Too expensive" },
  { key: "missing",      label: "Missing a feature I need" },
  { key: "data_wrong",   label: "Numbers looked wrong" },
  { key: "just_testing", label: "Just testing / will come back" },
  { key: "other",        label: "Other" },
] as const;
export type UninstallReason = typeof UNINSTALL_REASONS[number]["key"];
