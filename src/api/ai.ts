import { apiClient } from './client';
import { MeetingAIProcessResponse, MeetingAIStatusResponse } from '../types/ai';

export interface ProcessAIOptions {
  tasks?: string[];
  force_reprocess?: boolean;
  request_id?: string;
}

export async function processMeetingAI(
  meetingId: string,
  options: ProcessAIOptions = {}
): Promise<MeetingAIProcessResponse> {
  return apiClient<MeetingAIProcessResponse>(`/api/v1/meetings/${meetingId}/ai/process`, {
    method: 'POST',
    body: JSON.stringify({
      tasks: options.tasks || ['summary', 'decisions', 'action_items', 'follow_up_email'],
      force_reprocess: options.force_reprocess ?? false,
      request_id: options.request_id || `web-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    }),
  });
}

export async function getMeetingAIStatus(meetingId: string): Promise<MeetingAIStatusResponse> {
  return apiClient<MeetingAIStatusResponse>(`/api/v1/meetings/${meetingId}/ai/status`);
}
