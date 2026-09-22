import { apiClient } from './client';
import { TranscriptViewResponse } from '../types/transcript';

export async function getTranscriptView(meetingId: string): Promise<TranscriptViewResponse> {
  return apiClient<TranscriptViewResponse>(`/api/v1/meetings/${meetingId}/transcript-view`);
}
