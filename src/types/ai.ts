export interface DecisionItem {
  decision: string;
  context?: string;
  evidence_timestamp?: string;
  owner?: string;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  due_date?: string;
  priority?: string;
  status: string;
  evidence_timestamp?: string;
}

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export interface AIOutput {
  summary?: string;
  key_points?: string[];
  decisions?: DecisionItem[];
  action_items?: ActionItem[];
  follow_up_email?: FollowUpEmail;
}

export interface ObservabilityInfo {
  provider: string;
  model: string;
  execution_time_ms: number;
}

export interface MeetingAIProcessResponse {
  status: string;
  request_id: string;
  meeting_id: string;
  google_sheets_url?: string | null;
  ai_status: string;
  sheets_sync_status: string;
  sheets_error_warning?: any | null;
  observability?: ObservabilityInfo | null;
  ai_output?: AIOutput | null;
}

export interface MeetingAIStatusResponse {
  meeting_id: string;
  ai_status: string;
  sheets_sync_status: string;
  has_cached_result: boolean;
  processed_at?: string | null;
}
