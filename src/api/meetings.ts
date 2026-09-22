import { apiClient } from './client';
import { MeetingListResponse, MeetingDetail } from '../types/meeting';

export interface ListMeetingsParams {
  page?: number;
  page_size?: number;
  sort?: 'start_time_desc' | 'start_time_asc' | 'created_at_desc' | 'created_at_asc';
  search?: string;
}

export async function listMeetings(params: ListMeetingsParams = {}): Promise<MeetingListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.page_size) query.set('page_size', params.page_size.toString());
  if (params.sort) query.set('sort', params.sort);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return apiClient<MeetingListResponse>(`/api/v1/meetings${qs ? `?${qs}` : ''}`);
}

export async function getMeeting(meetingId: string): Promise<MeetingDetail> {
  return apiClient<MeetingDetail>(`/api/v1/meetings/${meetingId}`);
}

export async function deleteMeeting(meetingId: string): Promise<{ success: boolean; message: string; meeting_id?: string }> {
  return apiClient<{ success: boolean; message: string; meeting_id?: string }>(`/api/v1/meetings/${meetingId}`, {
    method: 'DELETE',
  });
}

