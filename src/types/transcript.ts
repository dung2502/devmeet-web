export type TranscriptSourceType = 'OFFICIAL' | 'DOM' | 'NONE';

export interface TranscriptEntry {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface TranscriptViewResponse {
  meeting_id: string;
  source: TranscriptSourceType;
  total_entries: number;
  reason: string;
  entries: TranscriptEntry[];
  cross_session_coverage?: number | null;
  session_contributors?: string[] | null;
  active_capture_sessions?: number | null;
}

