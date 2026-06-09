export interface IIssue {
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  type: "bug" | "feature_request";
  createdBy: string; // user ID
}
