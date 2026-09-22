export interface Participant {
  id?: string;
  email?: string;
  display_name?: string;
  google_participant_name?: string;
  participant_type?: string;
  joined_at?: string;
  left_at?: string;
}

export interface MeetingListItem {
  id: string;
  user_id: string;
  conference_record_name?: string | null;
  meeting_space_name?: string | null;
  meeting_url?: string | null;
  meeting_code?: string | null;
  title?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  transcript_status: string;
  dom_capture_status: string;
  ai_status: string;
  sheets_sync_status: string;
  transcript_entry_count?: number;
  selected_transcript_source?: 'OFFICIAL' | 'DOM' | 'NONE' | null;
  participant_count: number;
  user_role?: 'OWNER' | 'PARTICIPANT' | string;
  host_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingListResponse {
  items: MeetingListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MeetingDetail {
  id: string;
  user_id: string;
  conference_record_name?: string | null;
  meeting_space_name?: string | null;
  meeting_url?: string | null;
  meeting_code?: string | null;
  title?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  transcript_status: string;
  dom_capture_status: string;
  ai_status: string;
  sheets_sync_status: string;
  transcript_entry_count?: number;
  google_sheets_url?: string | null;
  ai_result?: Record<string, any> | null;
  comparison_status?: string | null;
  comparison_metrics?: Record<string, any> | null;
  selected_transcript_source?: 'OFFICIAL' | 'DOM' | 'NONE' | null;
  participants: Participant[];
  user_role?: 'OWNER' | 'PARTICIPANT' | string;
  host_name?: string | null;
  created_at: string;
  updated_at: string;
}
