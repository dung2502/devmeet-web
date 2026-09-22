import { getApiBaseUrl, getAuthToken, ApiError } from './client';

export async function exportMeetingTxt(
  meetingId: string,
  type: 'transcript' | 'summary' | 'all' = 'all'
): Promise<void> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/meetings/${meetingId}/export?type=${type}`;

  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errorDetail = `Export failed with HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new ApiError(errorDetail, response.status);
  }

  // Extract filename from Content-Disposition header if present
  let filename = `meeting_${meetingId}_${type}.txt`;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1].trim();
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
